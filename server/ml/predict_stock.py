"""
predict_stock.py – Stock price forecasting + news sentiment analysis.

Called from Node.js:  spawn('python', ['predict_stock.py', 'AAPL'])

Outputs a single JSON object to stdout.  All debug / warning output goes
to stderr so the Node.js parent can JSON.parse(stdout) safely.

Features:
  - 6-month OHLCV data from Yahoo Finance
  - Technical indicators (RSI, MACD, SMA, Volatility)
  - Ensemble ML models (Random Forest + Gradient Boosting)
  - News sentiment analysis via Google News RSS + financial lexicon
"""

import sys
import json
import warnings
import datetime
import re
import xml.etree.ElementTree as ET
from html import unescape

# ── silence every possible warning before any library import ────────────
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    """Write a debug message to stderr (never to stdout)."""
    sys.stderr.write(f"[predict_stock] {msg}\n")
    sys.stderr.flush()


def emit_error(ticker: str, message: str) -> None:
    """Print a JSON error payload to stdout and exit."""
    print(json.dumps({"ticker": ticker, "error": message}), flush=True)
    sys.exit(1)


# ---------------------------------------------------------------------------
# 1.  Fetch OHLCV data from Yahoo Finance (raw API, no yfinance)
# ---------------------------------------------------------------------------

def fetch_ohlcv(ticker: str) -> pd.DataFrame:
    """Return a DataFrame with columns [date, open, high, low, close, volume]."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?range=6mo&interval=1d"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as exc:
        emit_error(ticker, f"Yahoo Finance API request failed: {exc}")

    try:
        data = resp.json()
        result = data["chart"]["result"][0]
        timestamps = result["timestamp"]
        quote = result["indicators"]["quote"][0]
    except (KeyError, TypeError, IndexError, json.JSONDecodeError) as exc:
        emit_error(ticker, f"Unexpected Yahoo Finance response structure: {exc}")

    df = pd.DataFrame(
        {
            "date": pd.to_datetime(timestamps, unit="s", utc=True),
            "open": quote.get("open"),
            "high": quote.get("high"),
            "low": quote.get("low"),
            "close": quote.get("close"),
            "volume": quote.get("volume"),
        }
    )

    # Normalise dates to plain date strings (UTC)
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    # Drop rows with any missing OHLCV value
    df.dropna(subset=["open", "high", "low", "close", "volume"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    if len(df) < 60:
        emit_error(ticker, f"Insufficient data: only {len(df)} rows returned.")

    return df


# ---------------------------------------------------------------------------
# 2.  Compute technical indicators
# ---------------------------------------------------------------------------

def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Wilder-smoothed RSI."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def compute_macd(
    series: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Return (macd_line, signal_line, histogram)."""
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add all required technical indicator columns in-place and return df."""
    close = df["close"].astype(float)
    volume = df["volume"].astype(float)

    df["RSI"] = compute_rsi(close)

    macd_line, macd_signal, _ = compute_macd(close)
    df["MACD"] = macd_line
    df["MACD_signal"] = macd_signal

    df["SMA_20"] = close.rolling(window=20).mean()
    df["SMA_50"] = close.rolling(window=50).mean()

    daily_returns = close.pct_change()
    df["volatility"] = daily_returns.rolling(window=20).std()

    df["volume_sma"] = volume.rolling(window=20).mean()

    return df


# ---------------------------------------------------------------------------
# 3 & 4.  Prepare features, train models, evaluate
# ---------------------------------------------------------------------------

FEATURE_COLS = [
    "close",
    "volume",
    "RSI",
    "MACD",
    "MACD_signal",
    "SMA_20",
    "SMA_50",
    "volatility",
    "volume_sma",
]


def train_and_evaluate(df: pd.DataFrame):
    """
    Return (rf_model, gb_model, rf_metrics, gb_metrics, feature_importances,
            best_model_name, best_model, last_row)
    where metrics = dict(r2, mae, rmse).
    """
    # Target: next-day close
    df = df.copy()
    df["target"] = df["close"].shift(-1)

    # Drop NaN rows (indicator warm-up + last row with no target)
    df.dropna(subset=FEATURE_COLS + ["target"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    if len(df) < 20:
        return None  # not enough data

    X = df[FEATURE_COLS].values
    y = df["target"].values

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    # --- Random Forest ---
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_metrics = {
        "r2": round(float(r2_score(y_test, rf_pred)), 4),
        "mae": round(float(mean_absolute_error(y_test, rf_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, rf_pred))), 4),
    }

    # --- Gradient Boosting ---
    gb = GradientBoostingRegressor(
        n_estimators=100, learning_rate=0.1, random_state=42
    )
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_metrics = {
        "r2": round(float(r2_score(y_test, gb_pred)), 4),
        "mae": round(float(mean_absolute_error(y_test, gb_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, gb_pred))), 4),
    }

    # --- Pick the better model ---
    if gb_metrics["r2"] >= rf_metrics["r2"]:
        best_name = "gradientBoosting"
        best_model = gb
        importances = gb.feature_importances_
    else:
        best_name = "randomForest"
        best_model = rf
        importances = rf.feature_importances_

    feat_imp = sorted(
        [
            {"feature": f, "importance": round(float(imp), 4)}
            for f, imp in zip(FEATURE_COLS, importances)
        ],
        key=lambda x: x["importance"],
        reverse=True,
    )

    # Last feature row (all indicators present) for forecasting
    last_row = df[FEATURE_COLS].iloc[-1].to_dict()

    return (rf, gb, rf_metrics, gb_metrics, feat_imp, best_name, best_model, last_row)


# ---------------------------------------------------------------------------
# 5.  Generate 7-day forecast (iterative)
# ---------------------------------------------------------------------------

def next_business_day(d: datetime.date) -> datetime.date:
    """Advance to the next weekday (Mon-Fri)."""
    d += datetime.timedelta(days=1)
    while d.weekday() >= 5:  # 5=Sat, 6=Sun
        d += datetime.timedelta(days=1)
    return d


def forecast_7_days(model, last_row: dict, last_date_str: str):
    """
    Iteratively predict 7 future trading days.

    For each step the predicted close replaces the 'close' feature;
    other indicators are kept constant (we lack future OHLCV to recompute
    them accurately, but this is standard for iterative point-forecasts).
    """
    forecasts = []
    current_row = last_row.copy()
    current_date = datetime.datetime.strptime(last_date_str, "%Y-%m-%d").date()

    for _ in range(7):
        feature_vec = np.array([[current_row[f] for f in FEATURE_COLS]])
        predicted_close = float(model.predict(feature_vec)[0])

        current_date = next_business_day(current_date)
        forecasts.append(
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "predictedPrice": round(predicted_close, 2),
            }
        )

        # Shift features forward: update close with predicted value
        current_row["close"] = predicted_close
        # Approximate SMA updates (shift slightly toward predicted close)
        if current_row.get("SMA_20"):
            current_row["SMA_20"] = (
                current_row["SMA_20"] * 19 + predicted_close
            ) / 20
        if current_row.get("SMA_50"):
            current_row["SMA_50"] = (
                current_row["SMA_50"] * 49 + predicted_close
            ) / 50

    return forecasts


# ---------------------------------------------------------------------------
# 5.  News Sentiment Analysis Engine
# ---------------------------------------------------------------------------

# Financial lexicon: word → sentiment weight (positive > 0, negative < 0)
FINANCIAL_LEXICON = {
    # ── Strong Positive (weight 2.0) ──
    "surge": 2.0, "soar": 2.0, "skyrocket": 2.0, "breakout": 2.0,
    "boom": 2.0, "rally": 2.0, "outperform": 2.0, "blockbuster": 2.0,
    "moonshot": 2.0, "explosive": 2.0,

    # ── Moderate Positive (weight 1.0 – 1.5) ──
    "gain": 1.0, "rise": 1.0, "climb": 1.0, "jump": 1.2, "advance": 1.0,
    "upgrade": 1.5, "buy": 1.5, "bullish": 1.5, "optimistic": 1.3,
    "beat": 1.3, "exceed": 1.3, "strong": 1.2, "growth": 1.2,
    "profit": 1.2, "revenue": 0.8, "earnings": 0.8, "dividend": 1.0,
    "recover": 1.0, "rebound": 1.3, "upbeat": 1.2, "positive": 1.0,
    "momentum": 1.0, "opportunity": 1.0, "innovation": 1.0, "record": 1.3,
    "high": 0.8, "expand": 1.0, "acquisition": 0.8, "partnership": 0.8,
    "breakthrough": 1.5, "approval": 1.2, "launch": 0.8, "success": 1.2,
    "overweight": 1.5, "accumulate": 1.3, "winner": 1.5, "impressive": 1.3,

    # ── Mild Positive (weight 0.3 – 0.7) ──
    "stable": 0.5, "steady": 0.5, "hold": 0.3, "neutral": 0.0,
    "resilient": 0.7, "support": 0.5, "sustain": 0.5,

    # ── Moderate Negative (weight -1.0 – -1.5) ──
    "fall": -1.0, "drop": -1.0, "decline": -1.0, "slip": -1.0,
    "lose": -1.0, "loss": -1.0, "downgrade": -1.5, "sell": -1.5,
    "bearish": -1.5, "pessimistic": -1.3, "miss": -1.3, "weak": -1.2,
    "cut": -1.0, "lower": -1.0, "risk": -0.8, "concern": -0.8,
    "warning": -1.0, "fear": -1.2, "volatile": -0.8, "uncertainty": -1.0,
    "debt": -0.8, "layoff": -1.3, "lawsuit": -1.2, "investigation": -1.0,
    "underweight": -1.5, "underperform": -1.5, "caution": -0.8,

    # ── Strong Negative (weight -2.0) ──
    "crash": -2.0, "plunge": -2.0, "collapse": -2.0, "bankrupt": -2.0,
    "bankruptcy": -2.0, "fraud": -2.0, "scandal": -2.0, "default": -2.0,
    "recession": -2.0, "crisis": -2.0, "tumble": -2.0, "tank": -2.0,
    "meltdown": -2.0, "devastating": -2.0, "catastrophe": -2.0,
}


def _clean_html(text: str) -> str:
    """Strip HTML tags and decode entities from RSS text."""
    text = unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip()


def _fetch_google_news(ticker: str, max_articles: int = 15) -> list[dict]:
    """
    Fetch recent news headlines for a stock ticker from Google News RSS.
    Returns list of {title, source, link, pubDate}.
    """
    url = (
        f"https://news.google.com/rss/search"
        f"?q={ticker}+stock&hl=en-US&gl=US&ceid=US:en"
    )
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        )
    }

    try:
        resp = requests.get(url, headers=headers, timeout=8)
        resp.raise_for_status()
    except Exception as e:
        log(f"Google News fetch failed: {e}")
        return []

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as e:
        log(f"RSS XML parse error: {e}")
        return []

    articles = []
    # RSS 2.0: root > channel > item
    channel = root.find("channel")
    if channel is None:
        return []

    for item in channel.findall("item")[:max_articles]:
        title_el = item.find("title")
        link_el = item.find("link")
        pub_el = item.find("pubDate")
        source_el = item.find("source")

        raw_title = _clean_html(title_el.text) if title_el is not None and title_el.text else ""
        if not raw_title:
            continue

        # Google News often appends " - SourceName" to titles
        source = ""
        if source_el is not None and source_el.text:
            source = source_el.text.strip()
        elif " - " in raw_title:
            parts = raw_title.rsplit(" - ", 1)
            raw_title = parts[0].strip()
            source = parts[1].strip() if len(parts) > 1 else ""

        articles.append({
            "title": raw_title,
            "source": source,
            "link": link_el.text.strip() if link_el is not None and link_el.text else "",
            "pubDate": pub_el.text.strip() if pub_el is not None and pub_el.text else "",
        })

    return articles


def _score_headline(headline: str) -> dict:
    """
    Score a single headline using the financial lexicon.
    Returns {title, score, label, matchedWords}.
    """
    words = re.findall(r"[a-z]+", headline.lower())
    total_score = 0.0
    matched = []

    for word in words:
        if word in FINANCIAL_LEXICON:
            weight = FINANCIAL_LEXICON[word]
            total_score += weight
            matched.append({"word": word, "weight": weight})

    # Normalize: clamp to [-1, 1] range
    if len(matched) > 0:
        normalized = max(-1.0, min(1.0, total_score / (len(matched) * 1.5)))
    else:
        normalized = 0.0

    # Label assignment
    if normalized >= 0.15:
        label = "Bullish"
    elif normalized <= -0.15:
        label = "Bearish"
    else:
        label = "Neutral"

    return {
        "title": headline,
        "score": round(normalized, 3),
        "label": label,
        "matchedWords": matched,
    }


def analyze_sentiment(ticker: str) -> dict:
    """
    Full sentiment analysis pipeline:
    1. Fetch Google News headlines for the ticker
    2. Score each headline with the financial lexicon
    3. Compute aggregate sentiment score
    
    Returns {sentimentScore, sentimentLabel, totalArticles, 
             bullishCount, bearishCount, neutralCount, newsHeadlines[]}.
    """
    articles = _fetch_google_news(ticker)

    if not articles:
        return {
            "sentimentScore": 0.0,
            "sentimentLabel": "Neutral",
            "totalArticles": 0,
            "bullishCount": 0,
            "bearishCount": 0,
            "neutralCount": 0,
            "newsHeadlines": [],
        }

    scored_headlines = []
    bullish = bearish = neutral = 0

    for article in articles:
        result = _score_headline(article["title"])
        result["source"] = article["source"]
        result["link"] = article["link"]
        result["pubDate"] = article["pubDate"]
        scored_headlines.append(result)

        if result["label"] == "Bullish":
            bullish += 1
        elif result["label"] == "Bearish":
            bearish += 1
        else:
            neutral += 1

    # Aggregate sentiment: weighted average of all headline scores
    total_weight = sum(abs(h["score"]) for h in scored_headlines) or 1.0
    aggregate = sum(h["score"] * abs(h["score"]) for h in scored_headlines) / total_weight
    aggregate = round(max(-1.0, min(1.0, aggregate)), 3)

    if aggregate >= 0.1:
        agg_label = "Bullish"
    elif aggregate <= -0.1:
        agg_label = "Bearish"
    else:
        agg_label = "Neutral"

    return {
        "sentimentScore": aggregate,
        "sentimentLabel": agg_label,
        "totalArticles": len(scored_headlines),
        "bullishCount": bullish,
        "bearishCount": bearish,
        "neutralCount": neutral,
        "newsHeadlines": scored_headlines,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    # ── CLI argument --------------------------------------------------------
    if len(sys.argv) < 2:
        emit_error("UNKNOWN", "Usage: python predict_stock.py <TICKER>")

    ticker = sys.argv[1].upper().strip()
    if not ticker:
        emit_error("UNKNOWN", "Empty ticker symbol.")

    log(f"Starting prediction for {ticker}")

    # ── 1. Fetch data -------------------------------------------------------
    df = fetch_ohlcv(ticker)
    log(f"Fetched {len(df)} rows of OHLCV data")

    current_price = round(float(df["close"].iloc[-1]), 2)
    last_date_str = df["date"].iloc[-1]

    # Historical prices for the response (last 30 data points for brevity)
    historical_prices = [
        {"date": row["date"], "price": round(float(row["close"]), 2)}
        for _, row in df.tail(30).iterrows()
    ]

    # ── 2. Technical indicators ---------------------------------------------
    df = add_indicators(df)
    log("Technical indicators computed")

    # ── 3 & 4. Train / evaluate ---------------------------------------------
    result = train_and_evaluate(df)
    if result is None:
        emit_error(ticker, "Not enough data to train models after indicator warm-up.")

    (
        rf_model,
        gb_model,
        rf_metrics,
        gb_metrics,
        feat_imp,
        best_name,
        best_model,
        last_row,
    ) = result
    log(f"Models trained – best: {best_name}")

    # ── 5. Forecast ---------------------------------------------------------
    forecasts = forecast_7_days(best_model, last_row, last_date_str)
    log("7-day forecast generated")

    # ── 6. News Sentiment Analysis ------------------------------------------
    sentiment_result = analyze_sentiment(ticker)
    log(f"Sentiment analysis complete: score={sentiment_result['sentimentScore']}, "
        f"articles={len(sentiment_result['newsHeadlines'])}")

    # ── 7. Build output JSON ------------------------------------------------
    output = {
        "ticker": ticker,
        "currentPrice": current_price,
        "forecast": forecasts,
        "models": {
            "randomForest": rf_metrics,
            "gradientBoosting": gb_metrics,
        },
        "bestModel": best_name,
        "featureImportance": feat_imp,
        "historicalPrices": historical_prices,
        "sentiment": sentiment_result,
    }

    print(json.dumps(output), flush=True)


if __name__ == "__main__":
    main()

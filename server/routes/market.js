import express from "express";
import User from "../models/User.js";
import StockTransaction from "../models/StockTransaction.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Helper to fetch stock data from Yahoo Finance
async function fetchYahooStockData(ticker, range = "1mo", interval = "1d") {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`
    );
    const json = await response.json();
    const result = json?.chart?.result?.[0];
    
    if (!result) return null;
    return result;
  } catch (error) {
    console.error(`Error fetching Yahoo stock data for ${ticker}:`, error);
    return null;
  }
}

// 1. Search Stock Ticker (Historical and Live Data)
router.get("/search/:ticker", verifyToken, async (req, res) => {
  const { ticker } = req.params;
  const { range = "1mo", interval = "1d" } = req.query;

  try {
    const data = await fetchYahooStockData(ticker.toUpperCase(), range, interval);

    if (!data) {
      return res.status(404).json({ message: "Stock ticker not found or Yahoo Finance service down." });
    }

    const meta = data.meta;
    const timestamps = data.timestamp || [];
    const quotes = data.indicators?.quote?.[0] || {};
    
    // Format historical data for Recharts charting on frontend
    const history = timestamps.map((timestamp, index) => {
      const price = quotes.close?.[index];
      const d = new Date(timestamp * 1000);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        date: dateStr,
        price: price ? parseFloat(price.toFixed(2)) : null,
      };
    }).filter(item => item.price !== null);

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;

    res.status(200).json({
      symbol: meta.symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      exchange: meta.exchangeName,
      currency: meta.currency,
      history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Buy Virtual Stock Shares
router.post("/buy", verifyToken, async (req, res) => {
  const { ticker, shares, price } = req.body;
  const userId = req.userId;

  if (!ticker || !shares || !price || shares <= 0 || price <= 0) {
    return res.status(400).json({ message: "Invalid order parameters." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const totalCost = shares * price;
    if (user.buyingPower < totalCost) {
      return res.status(400).json({ message: "Insufficient buying power." });
    }

    // Deduct buying power
    user.buyingPower -= totalCost;

    // Check if user already holds this stock
    const holdingIndex = user.holdings.findIndex(
      (h) => h.ticker === ticker.toUpperCase()
    );

    if (holdingIndex >= 0) {
      // Recalculate average price and total shares
      const existingHolding = user.holdings[holdingIndex];
      const newShares = existingHolding.shares + shares;
      const newAvgPrice = ((existingHolding.shares * existingHolding.averagePrice) + totalCost) / newShares;
      
      existingHolding.shares = newShares;
      existingHolding.averagePrice = parseFloat(newAvgPrice.toFixed(4));
    } else {
      // Add new holding
      user.holdings.push({
        ticker: ticker.toUpperCase(),
        shares,
        averagePrice: parseFloat(price.toFixed(4)),
      });
    }

    await user.save();

    // Log transaction
    const tx = new StockTransaction({
      userId,
      ticker: ticker.toUpperCase(),
      type: "BUY",
      price,
      shares,
    });
    await tx.save();

    res.status(200).json({
      message: `Successfully purchased ${shares} shares of ${ticker.toUpperCase()}`,
      buyingPower: user.buyingPower,
      holdings: user.holdings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Sell Virtual Stock Shares
router.post("/sell", verifyToken, async (req, res) => {
  const { ticker, shares, price } = req.body;
  const userId = req.userId;

  if (!ticker || !shares || !price || shares <= 0 || price <= 0) {
    return res.status(400).json({ message: "Invalid order parameters." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Check if user holds this stock
    const holdingIndex = user.holdings.findIndex(
      (h) => h.ticker === ticker.toUpperCase()
    );

    if (holdingIndex < 0) {
      return res.status(400).json({ message: "You do not own this stock." });
    }

    const holding = user.holdings[holdingIndex];
    if (holding.shares < shares) {
      return res.status(400).json({ message: "Insufficient shares to sell." });
    }

    // Deduct shares and add buying power
    const totalEarnings = shares * price;
    user.buyingPower += totalEarnings;
    holding.shares -= shares;

    if (holding.shares === 0) {
      // Remove holding if 0 shares left
      user.holdings.splice(holdingIndex, 1);
    }

    await user.save();

    // Log transaction
    const tx = new StockTransaction({
      userId,
      ticker: ticker.toUpperCase(),
      type: "SELL",
      price,
      shares,
    });
    await tx.save();

    res.status(200).json({
      message: `Successfully sold ${shares} shares of ${ticker.toUpperCase()}`,
      buyingPower: user.buyingPower,
      holdings: user.holdings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Get User Virtual Portfolio Status
router.get("/portfolio", verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    let holdingsValue = 0;
    const detailedHoldings = [];

    // Map each holding to current stock price
    for (const holding of user.holdings) {
      const data = await fetchYahooStockData(holding.ticker, "1d", "1d");
      
      const currentPrice = data?.meta?.regularMarketPrice || holding.averagePrice;
      const currentValue = holding.shares * currentPrice;
      const totalCost = holding.shares * holding.averagePrice;
      const gainLoss = currentValue - totalCost;
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      holdingsValue += currentValue;
      
      detailedHoldings.push({
        ticker: holding.ticker,
        shares: holding.shares,
        averagePrice: holding.averagePrice,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        gainLoss: parseFloat(gainLoss.toFixed(2)),
        gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
      });
    }

    const totalValue = user.buyingPower + holdingsValue;

    res.status(200).json({
      buyingPower: parseFloat(user.buyingPower.toFixed(2)),
      holdingsValue: parseFloat(holdingsValue.toFixed(2)),
      totalValue: parseFloat(totalValue.toFixed(2)),
      holdings: detailedHoldings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user trade transaction history logs
router.get("/history", verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const transactions = await StockTransaction.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Watchlist - Fetch live prices for popular tickers
const WATCHLIST_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX"];

router.get("/watchlist", verifyToken, async (req, res) => {
  try {
    const results = await Promise.allSettled(
      WATCHLIST_TICKERS.map(async (ticker) => {
        const data = await fetchYahooStockData(ticker, "5d", "1d");
        if (!data) return null;

        const meta = data.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        // Mini sparkline data (last 5 days)
        const timestamps = data.timestamp || [];
        const quotes = data.indicators?.quote?.[0] || {};
        const sparkline = timestamps.map((t, i) => {
          const close = quotes.close?.[i];
          return close ? parseFloat(close.toFixed(2)) : null;
        }).filter(Boolean);

        return {
          symbol: meta.symbol,
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          sparkline,
        };
      })
    );

    const watchlist = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    res.status(200).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

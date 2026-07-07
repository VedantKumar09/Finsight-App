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

function parseYahooMeta(result) {
  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};

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

  return {
    symbol: meta.symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    exchange: meta.exchangeName,
    currency: meta.currency,
    history,
  };
}

export { fetchYahooStockData, parseYahooMeta };

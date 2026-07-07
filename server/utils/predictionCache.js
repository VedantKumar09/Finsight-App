const predictionCache = new Map();
const PREDICTION_TTL = 1000 * 60 * 60; // 1 hour

export function getCachedPrediction(ticker) {
  const t = predictionCache.get(ticker?.toUpperCase());
  if (!t) return null;
  if (Date.now() - t.ts > PREDICTION_TTL) return null;
  // return value augmented with cache metadata
  try {
    const result = typeof t.value === 'object' ? { ...t.value } : { data: t.value };
    result._fromCache = true;
    result._cachedAt = t.ts;
    return result;
  } catch (e) {
    return t.value;
  }
}

export function setCachedPrediction(ticker, value) {
  try {
    predictionCache.set(ticker.toUpperCase(), { ts: Date.now(), value });
  } catch {}
}

export function rawCache() {
  return predictionCache;
}

export default {
  getCachedPrediction,
  setCachedPrediction,
  rawCache,
};

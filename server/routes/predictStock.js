import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/auth.js";
import { getCachedPrediction, setCachedPrediction } from "../utils/predictionCache.js";
import { enqueuePrediction, getPending } from "../utils/predictionQueue.js";
import { rawCache } from "../utils/predictionCache.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory cache for predictions
const predictionCache = new Map();
const PREDICTION_TTL = 1000 * 60 * 60; // 1 hour

// POST /predict/stock - triggers time-series forecasting via Python ML
router.post("/", verifyToken, async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ message: "Ticker symbol is required" });
    }

    const uppercaseTicker = ticker.toUpperCase();

    // Return cached prediction if fresh
    const cached = getCachedPrediction(uppercaseTicker);
    if (cached) {
      return res.status(200).json(cached);
    }

    // If a job is already pending, inform client
    const pending = getPending();
    if (pending.includes(uppercaseTicker)) {
      return res.status(202).json({ message: "Prediction queued and running", ticker: uppercaseTicker });
    }

    // Enqueue prediction job (worker will run in background)
    enqueuePrediction(uppercaseTicker);
    return res.status(202).json({ message: "Prediction queued", ticker: uppercaseTicker });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

// Status endpoint: check cache or pending status for a ticker
router.get("/status/:ticker", async (req, res) => {
  try {
    const ticker = (req.params.ticker || "").toUpperCase();
    if (!ticker) return res.status(400).json({ message: "Ticker required" });

    const cached = getCachedPrediction(ticker);
    if (cached) return res.status(200).json(cached);

    const pending = getPending();
    if (pending.includes(ticker)) {
      return res.status(202).json({ message: "pending" });
    }

    return res.status(404).json({ message: "not found" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Return pending jobs and cached keys
router.get("/pending", async (req, res) => {
  try {
    const pending = getPending();
    const cache = rawCache();
    const cachedKeys = Array.from(cache.keys()).slice(-20); // last 20 cached tickers
    res.status(200).json({ pending, cached: cachedKeys });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return full cache details (ticker + cached timestamp)
router.get("/cache", async (req, res) => {
  try {
    const cache = rawCache();
    const entries = Array.from(cache.entries()).map(([k, v]) => ({ ticker: k, ts: v.ts }));
    res.status(200).json(entries.sort((a,b)=>b.ts-a.ts));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

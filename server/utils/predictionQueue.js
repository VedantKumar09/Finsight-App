import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { setCachedPrediction } from "./predictionCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queue = [];
const pending = new Set();
let running = false;

export function enqueuePrediction(ticker) {
  const key = ticker.toUpperCase();
  if (pending.has(key)) return false;
  pending.add(key);
  queue.push(key);
  runWorker().catch((e) => console.error("Prediction worker error:", e));
  return true;
}

async function runWorker() {
  if (running) return;
  running = true;

  while (queue.length > 0) {
    const ticker = queue.shift();
    try {
      await processJob(ticker);
    } catch (err) {
      console.error("Error processing prediction for", ticker, err?.message || err);
    } finally {
      pending.delete(ticker);
    }
  }

  running = false;
}

async function processJob(ticker) {
  const mlPath = path.join(__dirname, "..", "ml");
  const scriptPath = path.join(mlPath, "predict_stock.py");

  console.log("[predictionQueue] Running prediction for", ticker);

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [scriptPath, ticker], { cwd: mlPath });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (d) => (stdout += d.toString()));
    pythonProcess.stderr.on("data", (d) => (stderr += d.toString()));

    const timeout = setTimeout(() => {
      try {
        pythonProcess.kill();
      } catch {}
      reject(new Error("Prediction timed out"));
    }, 60000);

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        console.error("Prediction script failed for", ticker, "code", code, "stderr", stderr);
        return reject(new Error(stderr || `Exited ${code}`));
      }

      try {
        let resultString = stdout.trim();
        const jsonMatch = resultString.match(/\{[\s\S]*\}/);
        if (jsonMatch) resultString = jsonMatch[0];
        const result = JSON.parse(resultString);
        setCachedPrediction(ticker, result);
        console.log("[predictionQueue] Prediction complete for", ticker);
        resolve(result);
      } catch (err) {
        console.error("Prediction parse error for", ticker, err?.message || err, "stdout", stdout);
        reject(err);
      }
    });

    pythonProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export function getPending() {
  return Array.from(pending);
}

export default { enqueuePrediction, getPending };

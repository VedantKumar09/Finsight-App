import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /predict/stock - triggers time-series forecasting via Python ML
router.post("/", verifyToken, async (req, res) => {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ message: "Ticker symbol is required" });
    }

    const uppercaseTicker = ticker.toUpperCase();

    // Spawn python process
    const mlPath = path.join(__dirname, "../ml");
    const scriptPath = path.join(mlPath, "predict_stock.py");

    console.log("Running stock forecasting script:", { scriptPath, ticker: uppercaseTicker });

    const pythonProcess = spawn("python", [scriptPath, uppercaseTicker], {
      cwd: mlPath,
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Set a timeout to prevent hanging (60 seconds, since training two models on-demand takes a bit)
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      console.error("Python stock script timeout after 60 seconds");
      if (!res.headersSent) {
        res.status(500).json({
          message: "Stock prediction timeout",
          error: "ML training took too long to execute"
        });
      }
    }, 60000);

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        console.error("Python stock script exited with code:", code);
        console.error("Stderr:", stderr);
        if (!res.headersSent) {
          return res.status(500).json({
            message: "Stock prediction model training failed",
            error: stderr || "Python script execution failed"
          });
        }
        return;
      }

      try {
        let resultString = stdout.trim();
        
        // Find JSON block in the output (handles warnings or additional prints)
        const jsonMatch = resultString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          resultString = jsonMatch[0];
        }

        console.log("Python Stock prediction output length:", resultString.length);
        const result = JSON.parse(resultString);

        if (result.error) {
          if (!res.headersSent) {
            return res.status(500).json({
              message: "Stock prediction engine error",
              error: result.error
            });
          }
          return;
        }

        if (!res.headersSent) {
          res.status(200).json(result);
        }
      } catch (parseError) {
        console.error("JSON parse error from Python:", parseError);
        console.error("Raw stdout was:", stdout);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Failed to parse prediction result",
            error: parseError.message
          });
        }
      }
    });

    pythonProcess.on("error", (error) => {
      clearTimeout(timeout);
      console.error("Failed to start Python stock prediction process:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Stock prediction failed to start",
          error: error.message || "Failed to execute Python script"
        });
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

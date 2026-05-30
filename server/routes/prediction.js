import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/auth.js";
import Prediction from "../models/Prediction.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make prediction
router.post("/", verifyToken, async (req, res) => {
  try {
    const { revenue, expenses, marketingSpend = 0, operationalCosts = 0 } = req.body;

    if (!revenue || !expenses) {
      return res.status(400).json({ message: "Revenue and expenses are required" });
    }

    // Prepare input for Python script
    const inputData = [revenue, expenses, marketingSpend, operationalCosts];

    // Run Python prediction script using child_process
    const mlPath = path.join(__dirname, "../ml");
    const scriptPath = path.join(mlPath, "predict.py");
    
    console.log("Running prediction with:", { scriptPath, args: inputData });

    // Use spawn for better control and reliability
    const pythonProcess = spawn("python", [scriptPath, ...inputData.map(String)], {
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

    // Set a timeout to prevent infinite hanging (30 seconds)
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      console.error("Python script timeout after 30 seconds");
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Prediction timeout", 
          error: "Python script took too long to execute"
        });
      }
    }, 30000);

    pythonProcess.on("close", async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        console.error("Python script exited with code:", code);
        console.error("Stderr:", stderr);
        if (!res.headersSent) {
          return res.status(500).json({ 
            message: "Prediction failed", 
            error: stderr || "Python script execution failed"
          });
        }
        return;
      }

      try {
        // Extract JSON from output
        let resultString = stdout.trim();
        
        // Find JSON in output (handle warnings, etc.)
        const jsonMatch = resultString.match(/\{[^}]*predictedProfit[^}]*\}/);
        if (jsonMatch) {
          resultString = jsonMatch[0];
        }
        
        // If still no JSON, try to find any JSON object
        if (!resultString.startsWith("{")) {
          const lines = resultString.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
              resultString = trimmed;
              break;
            }
          }
        }
        
        console.log("Python output:", resultString);
        const result = JSON.parse(resultString);
        
        if (result.error) {
          if (!res.headersSent) {
            return res.status(500).json({ 
              message: "Prediction error", 
              error: result.error 
            });
          }
          return;
        }
        
        const predictedProfit = result.predictedProfit;
        const confidence = result.confidence || 0;

        // Save prediction to database
        const prediction = await Prediction.create({
          userId: req.userId,
          revenue,
          expenses,
          marketingSpend,
          operationalCosts,
          predictedProfit,
          confidence,
          inputValues: {
            revenue,
            expenses,
            marketingSpend,
            operationalCosts,
          },
        });

        if (!res.headersSent) {
          res.status(200).json({
            predictedProfit,
            confidence,
            predictionId: prediction._id,
          });
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        console.error("Stdout was:", stdout);
        console.error("Stderr was:", stderr);
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
      console.error("Failed to start Python process:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Prediction failed", 
          error: error.message || "Failed to execute Python script"
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get prediction history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const predictions = await Prediction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


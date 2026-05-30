"""
Make profit prediction using trained model
Called from Node.js backend
"""
import sys
import json
import joblib
import os
import warnings

# Suppress all warnings to stderr
warnings.filterwarnings('ignore')

# Get input from command line arguments
# Args: revenue, expenses, marketing_spend, operational_costs
try:
    revenue = float(sys.argv[1])
    expenses = float(sys.argv[2])
    marketing_spend = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    operational_costs = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
except (ValueError, IndexError):
    print(json.dumps({"error": "Invalid input parameters"}))
    sys.exit(1)

# Load trained model
# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'profit_model.pkl')

if not os.path.exists(model_path):
    error_msg = f"Model not found at {model_path}. Please train the model first."
    print(json.dumps({
        "error": error_msg,
        "predictedProfit": 0,
        "confidence": 0
    }))
    sys.exit(1)

try:
    model = joblib.load(model_path)
    
    # Prepare input features
    features = [[revenue, expenses, marketing_spend, operational_costs]]
    
    # Make prediction (suppress warnings)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        predicted_profit = model.predict(features)[0]
    
    # Calculate confidence (using feature importance or simple heuristic)
    # For simplicity, we'll use a basic confidence score
    # In production, you might use prediction intervals or model uncertainty
    confidence = min(95, max(60, 100 - abs(expenses / revenue * 100) if revenue > 0 else 70))
    
    # Return result as JSON (only this line should be printed)
    result = {
        "predictedProfit": round(float(predicted_profit), 2),
        "confidence": round(float(confidence), 2)
    }
    
    # Print only the JSON result to stdout, flush to ensure it's sent
    print(json.dumps(result), flush=True)
    
except Exception as e:
    error_result = json.dumps({
        "error": str(e),
        "predictedProfit": 0,
        "confidence": 0
    })
    print(error_result, flush=True)
    sys.exit(1)


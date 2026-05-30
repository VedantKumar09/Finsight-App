"""
Train a Random Forest model for profit prediction
Run this script once to generate profit_model.pkl
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Generate synthetic finance data if no real data exists
def generate_synthetic_data(n_samples=1000):
    """Generate realistic synthetic finance data"""
    np.random.seed(42)
    
    revenue = np.random.uniform(10000, 100000, n_samples)
    expenses = np.random.uniform(5000, 80000, n_samples)
    marketing_spend = np.random.uniform(1000, 20000, n_samples)
    operational_costs = np.random.uniform(2000, 30000, n_samples)
    
    # Profit = Revenue - Expenses - Marketing - Operational
    # Add some noise to make it realistic
    profit = revenue - expenses - marketing_spend - operational_costs
    noise = np.random.normal(0, 5000, n_samples)
    profit = profit + noise
    
    data = {
        'revenue': revenue,
        'expenses': expenses,
        'marketing_spend': marketing_spend,
        'operational_costs': operational_costs,
        'profit': profit
    }
    
    return pd.DataFrame(data)

# Main training function
def train_model():
    # Try to load existing data, otherwise generate synthetic
    data_file = 'finance_history.csv'
    if os.path.exists(data_file):
        print(f"Loading data from {data_file}")
        df = pd.read_csv(data_file)
    else:
        print("No data file found. Generating synthetic data...")
        df = generate_synthetic_data(1000)
        df.to_csv(data_file, index=False)
        print(f"Synthetic data saved to {data_file}")
    
    # Prepare features and target
    X = df[['revenue', 'expenses', 'marketing_spend', 'operational_costs']]
    y = df['profit']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train Random Forest model
    print("Training Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"Mean Absolute Error: ${mae:.2f}")
    print(f"R² Score: {r2:.4f}")
    
    # Save model
    model_path = 'profit_model.pkl'
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    
    return model

if __name__ == "__main__":
    train_model()


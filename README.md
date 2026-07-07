# Finance Dashboard & Stock Simulator App

Build A MERN Finance Dashboard and Stock Simulator App with ML-based Profit & Stock Predictions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- MongoDB (local or Atlas)

### Installation & Run

**1. Backend Setup:**
```bash
cd server
npm install
cd ml
pip install -r requirements.txt
python train_model.py
cd ..
# Create .env file (see SETUP.md)
npm run dev
```

**2. Frontend Setup (new terminal):**
```bash
cd client
npm install
# Create .env file with VITE_BASE_URL=http://localhost:9000
npm run dev
```

**3. Access Application:**
Open http://localhost:5173 in your browser

## ✨ Features

- ✅ **User Authentication** (JWT-based login/register)
- ✅ **Financial Dashboard** with charts and KPIs
- ✅ **ML-based Profit Prediction** (Random Forest model)
- ✅ **Prediction History** tracking per user
- ✅ **Stock Simulator & Portfolio** (Real-time tracking, Buy/Sell transactions, Portfolio, & Watchlist)
- ✅ **ML Stock Price Forecasting** (Python model)
- ✅ **Protected Routes** for authenticated users

## 📚 Documentation

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DATABASE_ACCESS.md](./DATABASE_ACCESS.md)** - Database access guide

## 🛠️ Tech Stack

- **Frontend:** React, JavaScript (JSX), Material-UI, Redux Toolkit, Recharts
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **ML:** Python, scikit-learn (Random Forest Regressor), pandas, numpy, joblib
- **Auth:** JWT, bcrypt

## 📊 Project Status

**Fully Functional** - All features working and tested

- Users registered & database seeded
- Profit and Stock predictions working with ML models
- Dashboard displaying financial data
- Simulator and transaction history fully functional

## 🎯 Quick Commands

```bash
# View database contents
cd server && npm run view-data

# Seed database
cd server && npm run seed

# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev
```

## 📁 Project Structure

- `/server` - Backend API with auth, prediction, and stock/market simulator routes
- `/client` - React frontend (JavaScript/JSX) with dashboard, authentication, predictions, and stock simulator UI
- `/server/ml` - Python ML training and prediction scripts (Profit & Stock predictions)

## 🎬 Demo Script (for presentation)

Follow these steps to run a concise demo for your thesis viva. Each step is quick and shows a key capability.

1. Start the backend API:

```powershell
cd server
npm install
npm run dev
```

2. Start the frontend (new terminal):

```powershell
cd client
npm install
# ensure client/.env contains VITE_BASE_URL=http://localhost:9000
npm run dev
```

3. Open the app (default Vite port):

Open http://localhost:5173 in your browser.

4. Demo flow to record or present:
- **Login** (show JWT-based auth) — explain token is stored in `localStorage`.
- **Watch live updates**: open a stock (e.g., `AAPL`) and point out the `LIVE` badge and live price changes (server broadcasts every ~5s).
- **Run ML prediction**: navigate to the AI Stock Predictor, enter `AAPL` (or `NVDA`) and press *Analyze & Predict* — show model metrics, 7-day forecast, and news sentiment.
- **Place a trade**: use the simulator to buy/sell virtual shares and show portfolio update / transaction history.

5. Quick checks while demoing:
- If live updates are missing, show the WebSocket auth-warning and re-login to demonstrate token handling.
- If prediction takes time, mention the ML training step and that the result is cached for subsequent requests.

## 🏗️ Architecture Overview

High-level components and data flow:

```mermaid
flowchart LR
	Browser[Client (React + RTK Query + WS Hook)] -->|HTTP /market/search| Server(API: Express)
	Browser -->|WebSocket /ws/market| Server
	Server -->|fetch| Yahoo[Yahoo Finance API]
	Server -->|spawn| ML[Python ML scripts]
	Server -->|MongoDB| DB[(MongoDB)]
	ML -->|JSON result| Server
	Server -->|priceUpdate| Browser
```

Notes:
- The server aggregates client ticker subscriptions and fetches market data; a lightweight in-memory cache reduces external calls.
- Predictions are produced by `server/ml/predict_stock.py`; results are cached for faster repeat queries.
- For scale, replace in-memory caches with Redis and move ML work to a background queue/worker.

## ✅ Recommended Short Improvements (for thesis appendix)

- Add a background job queue (e.g., BullMQ + Redis) for ML predictions to avoid blocking HTTP requests.
- Replace in-memory caches with Redis for horizontal scaling.
- Add API integration tests and a small e2e test to validate the WS + prediction flow.
- Add lightweight metrics (response times, WS connection counts) for post-demo evaluation.

---
This README section provides a compact demo script and architecture notes you can include in your thesis write-up or present during the viva.

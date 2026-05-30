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

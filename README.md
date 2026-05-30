# Finance Dashboard App

Build A MERN Finance Dashboard App with ML-based Profit Prediction

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
- ✅ **ML-based Profit Prediction** (Random Forest model)
- ✅ **Prediction History** tracking per user
- ✅ **Financial Dashboard** with charts and KPIs
- ✅ **Protected Routes** for authenticated users

## 📚 Documentation

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project guide
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DATABASE_ACCESS.md](./DATABASE_ACCESS.md)** - Database access guide

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Material-UI, Redux Toolkit, Recharts
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **ML:** Python, scikit-learn, Random Forest Regressor
- **Auth:** JWT, bcrypt

## 📊 Project Status

✅ **Fully Functional** - All features working and tested

- 3 users registered
- Predictions working with ML model
- Dashboard displaying financial data
- History tracking functional

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

- `/server` - Backend API with auth and prediction routes
- `/client` - React frontend with authentication and prediction UI
- `/server/ml` - Python ML training and prediction scripts

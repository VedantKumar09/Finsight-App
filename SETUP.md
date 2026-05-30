# Finance App - Setup Instructions

## Overview

This is a MERN stack finance dashboard application with:
- **Authentication** (JWT-based login/register)
- **ML-based Profit Prediction** (Random Forest model)
- **Prediction History** tracking
- **Financial Dashboard** with charts and KPIs

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8+ (for ML model)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=9000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Install Python dependencies:**
   ```bash
   cd ml
   pip install -r requirements.txt
   ```

5. **Train the ML model (one-time setup):**
   ```bash
   python train_model.py
   ```
   This will generate `profit_model.pkl` in the `ml` directory.

6. **Start the backend server:**
   ```bash
   cd ..
   npm run dev
   ```

## Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `client` directory:
   ```env
   VITE_BASE_URL=http://localhost:9000
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Usage

1. **Register a new account:**
   - Navigate to `/register`
   - Fill in your details and create an account

2. **Login:**
   - Navigate to `/login`
   - Use your credentials to log in

3. **Make Predictions:**
   - Go to the "Predictions" page
   - Enter revenue, expenses, and optional marketing/operational costs
   - Click "Predict Profit" to get ML-based predictions

4. **View History:**
   - Navigate to "History" in the navbar
   - View all your previous predictions

## Project Structure

```
finance-app/
├── server/
│   ├── models/
│   │   ├── User.js          # User model for authentication
│   │   ├── Prediction.js    # Prediction history model
│   │   ├── KPI.js
│   │   ├── Product.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── prediction.js   # Prediction routes
│   │   ├── kpi.js
│   │   ├── product.js
│   │   └── transaction.js
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── ml/
│   │   ├── train_model.py   # ML model training script
│   │   ├── predict.py       # ML prediction script
│   │   ├── profit_model.pkl # Trained model (generated)
│   │   └── requirements.txt
│   └── index.js
├── client/
│   └── src/
│       ├── scenes/
│       │   ├── login/       # Login page
│       │   ├── register/    # Register page
│       │   ├── dashboard/   # Main dashboard
│       │   ├── predictions/ # Prediction page
│       │   └── predictionHistory/ # History page
│       ├── components/
│       │   └── ProtectedRoute.tsx
│       ├── state/
│       │   └── api.ts       # RTK Query API
│       └── App.tsx
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Predictions
- `POST /predict/` - Make a profit prediction (requires auth)
- `GET /predict/history` - Get prediction history (requires auth)

### Finance Data
- `GET /kpi/kpis/` - Get KPI data
- `GET /product/products/` - Get product data
- `GET /transaction/transactions/` - Get transaction data

## ML Model Details

- **Algorithm:** Random Forest Regressor
- **Features:** Revenue, Expenses, Marketing Spend, Operational Costs
- **Target:** Profit
- **Training:** Run `train_model.py` to train on synthetic or real data
- **Inference:** Called via Python shell from Node.js backend

## Notes

- The ML model uses synthetic data by default if no `finance_history.csv` is found
- JWT tokens expire after 30 days
- Predictions are stored per user in MongoDB
- Protected routes require valid JWT token

## Troubleshooting

1. **Python not found:** Make sure Python is in your PATH, or update `pythonPath` in `server/routes/prediction.js`
2. **Model not found:** Run `train_model.py` first to generate the model
3. **MongoDB connection error:** Check your `MONGO_URL` in `.env`
4. **CORS errors:** Ensure backend CORS is configured correctly


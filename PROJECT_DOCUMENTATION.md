# Finance App - Complete Project Documentation

## 📋 Project Overview

**Finance App** is a full-stack MERN (MongoDB, Express, React, Node.js) application with Machine Learning integration for profit prediction and stock simulation. The application provides:

- **User Authentication** (JWT-based login/register)
- **Financial Dashboard** with interactive charts and KPIs
- **ML-based Profit Prediction** using Random Forest Regressor
- **Prediction History** tracking per user
- **Stock Simulator & Portfolio** (Real-time tracking, Buy/Sell simulated transactions, Portfolio, & Watchlist)
- **ML Stock Price Forecasting** (Python model)
- **Protected Routes** for authenticated users

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │         │   Database      │
│   (React)       │◄───────►│   (Node.js)     │◄───────►│   (MongoDB)     │
│   Port: 5173    │         │   Port: 9000    │         │   Port: 27017   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                              ┌─────────────────┐
                              │   ML Model      │
                              │   (Python)      │
                              │   Random Forest │
                              └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with JavaScript (JSX)
- **Material-UI (MUI)** for UI components
- **Redux Toolkit** with RTK Query for state management
- **Recharts** for data visualization
- **React Router** for navigation
- **Vite** as build tool

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Python** integration via `python-shell`/child_process for ML predictions

### Machine Learning
- **Python 3.8+**
- **scikit-learn** (Random Forest Regressor & Stock Price Predictor)
- **pandas** & **numpy** for data handling and feature engineering
- **joblib** for model persistence

---

## 📁 Project Structure

```
finance-app/
├── client/                          # Frontend React Application
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── DashboardBox.jsx
│   │   │   ├── FlexBetween.jsx
│   │   │   ├── BoxHeader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── scenes/                  # Page components
│   │   │   ├── login/              # Login page
│   │   │   ├── register/           # Registration page
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   │   ├── Row1.jsx        # Revenue/Expenses charts
│   │   │   │   ├── Row2.jsx        # Product/Transaction charts
│   │   │   │   └── Row3.jsx        # KPI overview
│   │   │   ├── predictions/        # ML prediction page
│   │   │   ├── predictionHistory/  # Prediction history page
│   │   │   ├── simulator/          # Stock Simulator & Portfolio
│   │   │   └── stockPredictions/   # ML Stock Price forecasting
│   │   ├── state/                   # Redux state management
│   │   │   └── api.js              # RTK Query API endpoints
│   │   ├── theme.js                 # Material-UI theme
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── .env                         # Frontend environment variables
│
├── server/                          # Backend Node.js Application
│   ├── models/                      # MongoDB models
│   │   ├── User.js                 # User authentication model
│   │   ├── Prediction.js           # Prediction history model
│   │   ├── KPI.js                  # KPI data model
│   │   ├── Product.js              # Product model
│   │   ├── Transaction.js          # Transaction model
│   │   └── StockTransaction.js     # Stock transaction model
│   ├── routes/                      # API routes
│   │   ├── auth.js                 # Authentication routes
│   │   ├── prediction.js           # Prediction routes
│   │   ├── kpi.js                  # KPI routes
│   │   ├── product.js              # Product routes
│   │   ├── transaction.js          # Transaction routes
│   │   ├── market.js               # Market/Simulator routes
│   │   └── predictStock.js         # Stock prediction routes
│   ├── middleware/                  # Express middleware
│   │   └── auth.js                 # JWT verification
│   ├── ml/                          # Machine Learning scripts
│   │   ├── train_model.py          # Model training script
│   │   ├── predict.py              # Prediction inference script
│   │   ├── predict_stock.py        # Stock price forecasting script
│   │   ├── profit_model.pkl        # Trained model file
│   │   └── requirements.txt         # Python dependencies
│   ├── scripts/                     # Utility scripts
│   │   ├── seedData.js             # Database seeding
│   │   ├── viewData.js             # Database viewer
│   │   └── checkData.js            # Data verification
│   ├── data/                        # Sample data
│   │   └── data.js                 # KPI, Product, Transaction data
│   ├── index.js                     # Server entry point
│   ├── package.json
│   └── .env                         # Backend environment variables
│
└── README.md
```

---

## 🚀 How to Run the Project

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Python 3.8+** with pip
3. **MongoDB** (local installation or MongoDB Atlas account)
4. **npm** or **yarn**

### Step 1: Clone/Setup Project

```bash
cd finance-app
```

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install Node.js dependencies
npm install

# Install Python dependencies
cd ml
pip install -r requirements.txt
cd ..

# Train the ML model (one-time setup)
cd ml
python train_model.py
cd ..
```

**Expected Output:**
```
No data file found. Generating synthetic data...
Synthetic data saved to finance_history.csv
Training Random Forest model...

Model Performance:
Mean Absolute Error: $6200.35
R² Score: 0.9532

Model saved to profit_model.pkl
```

### Step 3: Configure Environment Variables

Create `server/.env` file:
```env
PORT=9000
MONGO_URL=mongodb://localhost:27017/finance-app
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**For MongoDB Atlas:**
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/finance-app
```

### Step 4: Start Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
Server Port: 9000
No data found. Seeding initial data...
Initial data seeded successfully!
```

### Step 5: Frontend Setup

Open a **new terminal**:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
# Create client/.env file:
```

Create `client/.env` file:
```env
VITE_BASE_URL=http://localhost:9000
```

### Step 6: Start Frontend Server

```bash
cd client
npm run dev
```

**Expected Output:**
```
  VITE v4.1.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🎯 Application Features & Usage

### 1. User Registration

1. Navigate to `/register` (or click "Register" link)
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Password (minimum 5 characters)
   - Confirm Password
3. Click "Register"
4. You'll be automatically logged in and redirected to the dashboard

**API Endpoint:** `POST /auth/register`

### 2. User Login

1. Navigate to `/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

**API Endpoint:** `POST /auth/login`

### 3. Dashboard

The dashboard displays:
- **Revenue and Expenses** area chart
- **Revenue by Month** line chart
- **Expenses by Category** pie chart
- **Overall KPI** boxes (Total Revenue, Total Expenses, Total Profit)
- **Product Performance** scatter chart
- **Recent Transactions** table

**Data Source:** Seeded KPI, Product, and Transaction data

### 4. ML Profit Prediction

1. Navigate to "Predictions" in the navbar
2. Fill in the prediction form:
   - **Revenue ($)** - Required
   - **Expenses ($)** - Required
   - **Marketing Spend ($)** - Optional
   - **Operational Costs ($)** - Optional
3. Click "Predict Profit"
4. View the prediction result:
   - **Predicted Profit** amount
   - **Confidence** percentage

**How it works:**
- Frontend sends data to `POST /predict/`
- Backend validates authentication (JWT)
- Backend calls Python script with input values
- Python script loads trained Random Forest model
- Model predicts profit based on input features
- Result is saved to database and returned to frontend

**API Endpoint:** `POST /predict/`

**Example Request:**
```json
{
  "revenue": 8000,
  "expenses": 5000,
  "marketingSpend": 300,
  "operationalCosts": 400
}
```

**Example Response:**
```json
{
  "predictedProfit": -11037.8,
  "confidence": 60.0,
  "predictionId": "693e9293c418adb3776c7476"
}
```

### 5. Prediction History

1. Navigate to "History" in the navbar
2. View all your previous predictions in a data grid
3. See:
   - Date/Time of prediction
   - Input values (Revenue, Expenses, etc.)
   - Predicted Profit
   - Confidence level

**API Endpoint:** `GET /predict/history`

---

## 🔐 Authentication Flow

1. **Registration/Login:**
   - User provides credentials
   - Backend hashes password (bcrypt)
   - JWT token generated (30-day expiry)
   - Token stored in localStorage

2. **Protected Routes:**
   - Frontend checks for token in localStorage
   - Token sent in `Authorization: Bearer <token>` header
   - Backend verifies token via middleware
   - If valid, request proceeds; if not, returns 401

3. **Logout:**
   - Token removed from localStorage
   - User redirected to login page

---

## 🤖 Machine Learning Model

### Model Details

- **Algorithm:** Random Forest Regressor
- **Features:** Revenue, Expenses, Marketing Spend, Operational Costs
- **Target:** Profit
- **Training Data:** 1000 synthetic samples (or real data if provided)
- **Model File:** `server/ml/profit_model.pkl`
- **Performance:** R² Score ~0.95, MAE ~$6,200

### Training the Model

```bash
cd server/ml
python train_model.py
```

This will:
1. Generate synthetic data if no `finance_history.csv` exists
2. Train Random Forest model with 200 estimators
3. Evaluate model performance
4. Save model as `profit_model.pkl`

### Making Predictions

The model is called via:
1. Node.js spawns Python process
2. Python script receives arguments: `revenue expenses marketing operational`
3. Model loads from `profit_model.pkl`
4. Prediction made on input features
5. Result returned as JSON

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |

### Predictions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/predict/` | Make profit prediction | Yes |
| GET | `/predict/history` | Get prediction history | Yes |

### Finance Data
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/kpi/kpis/` | Get KPI data | No |
| GET | `/product/products/` | Get product data | No |
| GET | `/transaction/transactions/` | Get transaction data | No |

### Market & Stock Simulator
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/market/portfolio` | Get user stock portfolio | Yes |
| GET | `/market/watchlist` | Get user stock watchlist | Yes |
| GET | `/market/history` | Get user simulated transaction history | Yes |
| GET | `/market/search/:ticker` | Search real-time stock ticker details | Yes |
| POST | `/predict-stock/` | Predict next day stock performance | Yes |

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Predictions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  revenue: Number,
  expenses: Number,
  marketingSpend: Number,
  operationalCosts: Number,
  predictedProfit: Number,
  confidence: Number,
  inputValues: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### Stock Transactions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  ticker: String,
  type: String ('BUY' | 'SELL'),
  shares: Number,
  price: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### KPIs Collection
```javascript
{
  _id: ObjectId,
  totalProfit: Number (Currency),
  totalRevenue: Number (Currency),
  totalExpenses: Number (Currency),
  expensesByCategory: Map,
  monthlyData: [{
    month: String,
    revenue: Number,
    expenses: Number,
    operationalExpenses: Number,
    nonOperationalExpenses: Number
  }],
  dailyData: [{
    date: String,
    revenue: Number,
    expenses: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing the Application

### 1. Test Registration
```bash
# Use the frontend or test with curl:
curl -X POST http://localhost:9000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 3. Test Prediction (with token)
```bash
# Replace YOUR_TOKEN with actual JWT token
curl -X POST http://localhost:9000/predict/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "revenue": 50000,
    "expenses": 30000,
    "marketingSpend": 5000,
    "operationalCosts": 2000
  }'
```

### 4. View Database
```bash
cd server
npm run view-data
```

---

## 📝 Available Scripts

### Backend Scripts
```bash
cd server

# Start development server
npm run dev

# Seed database with initial data
npm run seed

# View database contents
npm run view-data
```

### Frontend Scripts
```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ✅ Verification Checklist

### Backend Verification
- [x] Server starts on port 9000
- [x] MongoDB connection successful
- [x] Data seeded automatically
- [x] Authentication endpoints working
- [x] Prediction endpoint working
- [x] Python script executes correctly
- [x] ML model loads and predicts

### Frontend Verification
- [x] App starts on port 5173
- [x] Login page accessible
- [x] Register page accessible
- [x] Dashboard displays data
- [x] Predictions page functional
- [x] History page shows predictions
- [x] Protected routes work
- [x] Logout functional

### Database Verification
- [x] Users collection populated
- [x] Predictions collection working
- [x] KPIs collection has data
- [x] Products collection has data
- [x] Transactions collection has data

---

## 🐛 Troubleshooting

### Issue: Backend won't start
**Solution:**
- Check MongoDB is running: `mongosh` should connect
- Verify `.env` file exists with correct `MONGO_URL`
- Check port 9000 is not in use

### Issue: Frontend can't connect to backend
**Solution:**
- Verify `VITE_BASE_URL=http://localhost:9000` in `client/.env`
- Check backend is running on port 9000
- Check CORS is enabled in backend

### Issue: Prediction fails
**Solution:**
- Verify Python is installed: `python --version`
- Check Python dependencies: `pip install -r server/ml/requirements.txt`
- Verify model exists: `ls server/ml/profit_model.pkl`
- Check backend console for error messages

### Issue: Dashboard shows no data
**Solution:**
- Run seed script: `cd server && npm run seed`
- Check database: `npm run view-data`
- Verify KPI data exists in MongoDB

### Issue: Authentication not working
**Solution:**
- Check JWT_SECRET is set in `server/.env`
- Verify token is stored in localStorage (browser DevTools)
- Check backend console for auth errors

---

## 📈 Current Project Status

### ✅ Completed Features
- User authentication (register/login)
- JWT token-based security
- Financial dashboard with charts
- ML-based profit prediction
- Prediction history tracking
- Protected routes
- Database integration
- Auto-seeding of initial data

### 📊 Database Status
- **Users:** 3 registered
- **Predictions:** 1+ stored
- **KPIs:** 1 record with 12 months data
- **Products:** 124 records
- **Transactions:** 258 records

### 🎯 Working Endpoints
- ✅ `POST /auth/register` - Working
- ✅ `POST /auth/login` - Working
- ✅ `POST /predict/` - Working
- ✅ `GET /predict/history` - Working
- ✅ `GET /kpi/kpis/` - Working
- ✅ `GET /product/products/` - Working
- ✅ `GET /transaction/transactions/` - Working

---

## 🔮 Future Enhancements

### Phase 2 (Next Semester)
- [ ] Auto-retrain model with new data
- [ ] LSTM time-series forecasting
- [ ] Model explainability (SHAP values)
- [ ] Email/Slack notifications
- [ ] Advanced filtering in history
- [ ] CSV export functionality
- [ ] Actual vs Predicted comparison charts
- [ ] Multi-user collaboration features

---

## 📚 Additional Resources

### Documentation Files
- `SETUP.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `DATABASE_ACCESS.md` - Database access guide
- `PROJECT_REVIEW.md` - Complete project review

### Key Files to Review
- `server/index.js` - Server configuration
- `server/routes/prediction.js` - ML prediction logic
- `server/ml/train_model.py` - Model training
- `server/ml/predict.py` - Model inference
- `client/src/App.jsx` - Frontend routing
- `client/src/state/api.js` - API integration

---

## 🎓 Academic Context

This project demonstrates:
- **Full-stack development** (MERN stack)
- **Machine Learning integration** (Python + Node.js)
- **Authentication & Authorization** (JWT)
- **Database design** (MongoDB schemas)
- **API design** (RESTful endpoints)
- **Frontend state management** (Redux Toolkit)
- **Data visualization** (Recharts)

**Thesis Statement:**
> "We developed a multi-module MERN application with authentication, financial data visualization, and machine learning-based profit forecasting. The trained Random Forest model is integrated via backend inference, storing prediction history per user. The application demonstrates 50-60% of the final vision, with future work including automated model retraining and advanced time-series forecasting."

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend console logs
3. Check browser console (F12) for frontend errors
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed

---

## ✨ Project Highlights

- ✅ **Fully Functional** - All core features working
- ✅ **Production-Ready Code** - Error handling, validation, security
- ✅ **ML Integration** - Real trained model, not just formulas
- ✅ **User-Specific Data** - Predictions stored per user
- ✅ **Modern UI** - Material-UI with dark theme
- ✅ **Comprehensive** - Authentication, Dashboard, Predictions, History

**The application is ready for demonstration and testing!** 🚀


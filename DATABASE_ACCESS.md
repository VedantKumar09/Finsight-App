# How to Access MongoDB Database

## Option 1: MongoDB Compass (GUI - Recommended)

MongoDB Compass is a visual tool to browse and query your database.

### Steps:
1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/try/download/compass
   - Download and install

2. **Connect to your database:**
   - Open MongoDB Compass
   - Enter your connection string from `server/.env`:
     ```
     mongodb://localhost:27017/finance-app
     ```
   - Or if using MongoDB Atlas:
     ```
     mongodb+srv://username:password@cluster.mongodb.net/finance-app
     ```
   - Click "Connect"

3. **Browse your data:**
   - You'll see all collections: `users`, `kpis`, `products`, `transactions`, `predictions`
   - Click on any collection to view documents
   - Use the filter/search bar to query data

## Option 2: MongoDB Shell (Command Line)

### Steps:
1. **Open MongoDB Shell:**
   ```bash
   mongosh
   ```

2. **Connect to your database:**
   ```javascript
   use finance-app
   ```

3. **View collections:**
   ```javascript
   show collections
   ```

4. **Query data:**
   ```javascript
   // View all users
   db.users.find().pretty()

   // View all predictions
   db.predictions.find().pretty()

   // View all KPIs
   db.kpis.find().pretty()

   // Count documents
   db.users.countDocuments()
   db.predictions.countDocuments()

   // Find specific user's predictions
   db.predictions.find({ userId: ObjectId("your-user-id") }).pretty()
   ```

## Option 3: Using Node.js Script

Create a script to query your database:

```javascript
// server/scripts/viewData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Prediction from "../models/Prediction.js";
import KPI from "../models/KPI.js";

dotenv.config();

const viewData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // View users
    const users = await User.find();
    console.log("\n=== USERS ===");
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // View predictions
    const predictions = await Prediction.find().populate('userId', 'firstName lastName email');
    console.log("\n=== PREDICTIONS ===");
    console.log(`Total predictions: ${predictions.length}`);
    predictions.forEach(pred => {
      console.log(`- User: ${pred.userId.firstName} ${pred.userId.lastName}`);
      console.log(`  Revenue: $${pred.revenue}, Expenses: $${pred.expenses}`);
      console.log(`  Predicted Profit: $${pred.predictedProfit}`);
      console.log(`  Date: ${pred.createdAt}`);
    });

    // View KPIs
    const kpis = await KPI.find();
    console.log("\n=== KPIs ===");
    console.log(`Total KPIs: ${kpis.length}`);
    kpis.forEach(kpi => {
      console.log(`- Total Revenue: $${kpi.totalRevenue}`);
      console.log(`  Total Profit: $${kpi.totalProfit}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

viewData();
```

Run it:
```bash
cd server
node scripts/viewData.js
```

## Option 4: MongoDB Atlas (If using cloud)

If you're using MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Click on your cluster
4. Click "Browse Collections" to view data
5. Or use "Data Explorer" for queries

## Quick Commands Reference

### Using mongosh:
```javascript
// Connect
use finance-app

// View all collections
show collections

// View all documents in a collection
db.users.find()
db.predictions.find()
db.kpis.find()

// Count documents
db.users.countDocuments()
db.predictions.countDocuments()

// Find specific document
db.users.findOne({ email: "user@example.com" })

// Delete all predictions (careful!)
// db.predictions.deleteMany({})

// View recent predictions
db.predictions.find().sort({ createdAt: -1 }).limit(5).pretty()
```

## Your Database Collections

Based on your app, you should have:
- **users** - User accounts (firstName, lastName, email, password)
- **predictions** - ML prediction history (revenue, expenses, predictedProfit, userId)
- **kpis** - Financial KPIs (totalProfit, totalRevenue, monthlyData)
- **products** - Product data
- **transactions** - Transaction data

## Connection String Location

Your MongoDB connection string is in:
- `server/.env` file
- Look for: `MONGO_URL=...`


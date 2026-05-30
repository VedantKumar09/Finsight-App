import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Prediction from "../models/Prediction.js";
import KPI from "../models/KPI.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";

dotenv.config();

const viewData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // View users
    const users = await User.find().select("-password");
    console.log("=== USERS ===");
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user._id}`);
    });

    // View predictions
    const predictions = await Prediction.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("\n=== RECENT PREDICTIONS (Last 10) ===");
    console.log(`Total predictions: ${await Prediction.countDocuments()}`);
    predictions.forEach((pred, index) => {
      const user = pred.userId;
      console.log(`\n${index + 1}. User: ${user?.firstName || "Unknown"} ${user?.lastName || ""}`);
      console.log(`   Revenue: $${pred.revenue.toLocaleString()}`);
      console.log(`   Expenses: $${pred.expenses.toLocaleString()}`);
      console.log(`   Marketing: $${pred.marketingSpend?.toLocaleString() || 0}`);
      console.log(`   Operational: $${pred.operationalCosts?.toLocaleString() || 0}`);
      console.log(`   Predicted Profit: $${pred.predictedProfit.toLocaleString()}`);
      console.log(`   Confidence: ${pred.confidence}%`);
      console.log(`   Date: ${new Date(pred.createdAt).toLocaleString()}`);
    });

    // View KPIs
    const kpis = await KPI.find();
    console.log("\n=== KPIs ===");
    console.log(`Total KPIs: ${kpis.length}`);
    kpis.forEach((kpi, index) => {
      console.log(`\n${index + 1}. Total Revenue: $${kpi.totalRevenue.toLocaleString()}`);
      console.log(`   Total Expenses: $${kpi.totalExpenses.toLocaleString()}`);
      console.log(`   Total Profit: $${kpi.totalProfit.toLocaleString()}`);
      console.log(`   Monthly Data Points: ${kpi.monthlyData?.length || 0}`);
    });

    // View Products
    const productCount = await Product.countDocuments();
    console.log(`\n=== PRODUCTS ===`);
    console.log(`Total products: ${productCount}`);

    // View Transactions
    const transactionCount = await Transaction.countDocuments();
    console.log(`\n=== TRANSACTIONS ===`);
    console.log(`Total transactions: ${transactionCount}`);

    console.log("\n✅ Data viewing complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

viewData();


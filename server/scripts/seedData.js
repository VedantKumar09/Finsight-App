import mongoose from "mongoose";
import dotenv from "dotenv";
import KPI from "../models/KPI.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import { kpis, products, transactions } from "../data/data.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Check if data already exists
    const existingKpis = await KPI.countDocuments();
    const existingProducts = await Product.countDocuments();
    const existingTransactions = await Transaction.countDocuments();

    if (existingKpis > 0 || existingProducts > 0 || existingTransactions > 0) {
      console.log("Data already exists. Skipping seed.");
      console.log(`KPIs: ${existingKpis}, Products: ${existingProducts}, Transactions: ${existingTransactions}`);
      process.exit(0);
    }

    // Clear existing data (optional - uncomment if you want to reset)
    // await mongoose.connection.db.dropDatabase();
    // console.log("Database cleared");

    // Insert data
    console.log("Seeding KPI data...");
    await KPI.insertMany(kpis);
    console.log(`Inserted ${kpis.length} KPIs`);

    console.log("Seeding Product data...");
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} Products`);

    console.log("Seeding Transaction data...");
    await Transaction.insertMany(transactions);
    console.log(`Inserted ${transactions.length} Transactions`);

    console.log("Data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();


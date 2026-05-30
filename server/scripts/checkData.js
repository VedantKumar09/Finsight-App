import mongoose from "mongoose";
import dotenv from "dotenv";
import KPI from "../models/KPI.js";

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    const kpis = await KPI.find().limit(1);
    
    if (kpis.length === 0) {
      console.log("No KPI data found!");
      process.exit(1);
    }

    console.log("KPI data found:");
    console.log("Total KPIs:", await KPI.countDocuments());
    console.log("\nFirst KPI sample:");
    console.log(JSON.stringify(kpis[0], null, 2));
    
    if (kpis[0].monthlyData && kpis[0].monthlyData.length > 0) {
      console.log("\nFirst monthly data entry:");
      console.log(JSON.stringify(kpis[0].monthlyData[0], null, 2));
      console.log("\nRevenue type:", typeof kpis[0].monthlyData[0].revenue);
      console.log("Revenue value:", kpis[0].monthlyData[0].revenue);
    } else {
      console.log("No monthly data found!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkData();


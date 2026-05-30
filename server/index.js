import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
// Legacy routes (kept for thesis reference, not used in UI)
// import kpiRoutes from "./routes/kpi.js";
// import productRoutes from "./routes/product.js";
// import transactionRoutes from "./routes/transaction.js";
import authRoutes from "./routes/auth.js";
// import predictionRoutes from "./routes/prediction.js";
import marketRoutes from "./routes/market.js";
import predictStockRoutes from "./routes/predictStock.js";
// Legacy models & seed data (kept for thesis reference)
// import KPI from "./models/KPI.js";
// import Product from "./models/Product.js";
// import Transaction from "./models/Transaction.js";
// import { kpis, products, transactions } from "./data/data.js";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.use("/auth", authRoutes);
// app.use("/kpi", kpiRoutes);         // Legacy
// app.use("/product", productRoutes);     // Legacy
// app.use("/transaction", transactionRoutes); // Legacy
// app.use("/predict", predictionRoutes);    // Legacy
app.use("/market", marketRoutes);
app.use("/predict-stock", predictStockRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 9000;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* Legacy seed data logic (disabled – data already exists in DB) */
  })
  .catch((error) => console.log(`${error} did not connect`));

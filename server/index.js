import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { WebSocketServer, WebSocket } from "ws";
import { verifyTokenDirect } from "./middleware/auth.js";
import { fetchYahooStockData, parseYahooMeta } from "./utils/yahooFinance.js";
// Legacy routes (kept for thesis reference, not used in UI)
// import kpiRoutes from "./routes/kpi.js";
// import productRoutes from "./routes/product.js";
// import transactionRoutes from "./routes/transaction.js";
import authRoutes from "./routes/auth.js";
// import predictionRoutes from "./routes/prediction.js";    // Legacy
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
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ── WebSocket Real-Time Market Data Server ─────────────────────────────── */
    const wss = new WebSocketServer({ server, path: "/ws/market" });

    const wsClients = new Map();

    wss.on("connection", (ws, req) => {
      const token = new URL(req.url, "http://localhost").searchParams.get("token");

      let userId = null;
      if (token) {
      try {
        const decoded = verifyTokenDirect(token);
        userId = decoded.id;
      } catch {
          ws.close(1008, "Unauthorized");
          return;
        }
      }

      wsClients.set(ws, {
        userId,
        subscriptions: new Set(),
      });

      ws.on("message", (raw) => {
        let msg;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }

        const client = wsClients.get(ws);
        if (!client) return;

        if (msg.type === "subscribe" && Array.isArray(msg.tickers)) {
          msg.tickers.forEach((t) => client.subscriptions.add(t.toUpperCase()));
        } else if (msg.type === "unsubscribe" && Array.isArray(msg.tickers)) {
          msg.tickers.forEach((t) => client.subscriptions.delete(t.toUpperCase()));
        }
      });

      ws.on("close", () => {
        wsClients.delete(ws);
      });

      ws.on("error", () => {
        wsClients.delete(ws);
      });
    });

    const BROADCAST_INTERVAL_MS = 5000;

    async function broadcastMarketUpdates() {
      const allTickers = new Set();
      wsClients.forEach((client) => {
        client.subscriptions.forEach((t) => allTickers.add(t));
      });

      if (allTickers.size === 0) return;

      const tickers = Array.from(allTickers);
      const results = await Promise.allSettled(
        tickers.map((t) => fetchYahooStockData(t, "1d", "1d"))
      );

      const priceMap = {};
      tickers.forEach((ticker, idx) => {
        const r = results[idx];
        if (r.status === "fulfilled" && r.value?.meta) {
          const meta = r.value.meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;

          priceMap[ticker] = {
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            timestamp: Date.now(),
          };
        }
      });

      if (Object.keys(priceMap).length === 0) return;

      const payload = JSON.stringify({ type: "priceUpdate", data: priceMap });

      wsClients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }

    setInterval(broadcastMarketUpdates, BROADCAST_INTERVAL_MS);

    /* Legacy seed data logic (disabled – data already exists in DB) */
  })
  .catch((error) => console.log(`${error} did not connect`));


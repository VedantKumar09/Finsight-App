import mongoose from "mongoose";

const Schema = mongoose.Schema;

const StockTransactionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    shares: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const StockTransaction = mongoose.model("StockTransaction", StockTransactionSchema);

export default StockTransaction;

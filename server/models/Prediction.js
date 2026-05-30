import mongoose from "mongoose";
import { loadType } from "mongoose-currency";

const Schema = mongoose.Schema;
loadType(mongoose);

const PredictionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revenue: {
      type: Number,
      required: true,
    },
    expenses: {
      type: Number,
      required: true,
    },
    marketingSpend: {
      type: Number,
      default: 0,
    },
    operationalCosts: {
      type: Number,
      default: 0,
    },
    predictedProfit: {
      type: Number,
      required: true,
    },
    confidence: {
      type: Number,
      default: 0,
    },
    inputValues: {
      type: Map,
      of: Number,
    },
  },
  { timestamps: true, toJSON: { getters: true } }
);

const Prediction = mongoose.model("Prediction", PredictionSchema);

export default Prediction;


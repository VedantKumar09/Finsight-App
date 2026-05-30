import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    buyingPower: {
      type: Number,
      default: 100000, // $100,000 starting virtual balance
    },
    holdings: [
      {
        ticker: { type: String, required: true },
        shares: { type: Number, required: true },
        averagePrice: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;


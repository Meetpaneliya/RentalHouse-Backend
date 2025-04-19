import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // useful for revenue tracking
    gateway: {
      type: String,
      enum: ["stripe", "razorpay", "paypal"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    // Add check-in and check-out dates
    checkIn: { type: Date, required: true }, // The date the user checks in
    checkOut: { type: Date, required: true }, // The date the user checks out

    transactionId: { type: String }, // store gateway's payment/session ID
  },
  { timestamps: true }
);

const payoutSchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["bank", "paypal"], required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    referenceId: String,
    paidAt: Date,
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
const Payout = mongoose.model("Payout", payoutSchema);
export { Payment, Payout };

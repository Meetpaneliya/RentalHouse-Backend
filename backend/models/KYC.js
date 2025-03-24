import mongoose from "mongoose";

const KYCSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    verificationType: {
      type: String,
      enum: ["ssn", "passport"],
      required: true,
    },

    ssn: {
      type: String,
    },
    // For Passport verification
    passportNumber: {
      type: String,
      // required only if verificationType is "passport"
    },
    passportDocument: {
      type: String,
      // URL for uploaded passport document
    },
    visaDocument: {
      type: String,
      // URL for uploaded visa document (required if passport is chosen)
    },
    // KYC status: pending, approved, or rejected
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const KYC = mongoose.model("KYC", KYCSchema);

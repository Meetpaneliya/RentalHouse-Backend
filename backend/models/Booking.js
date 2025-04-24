// models/Booking.js
import mongoose from "mongoose";
import { Listing } from "./listing.js"; // import listing model

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "checked-in", "checked-out"],
      default: "pending",
    },
    paid: { type: Boolean, default: false },
    transactionId: { type: String }, // store gateway's payment/session ID
  },
  { timestamps: true }
);

// 🧠 When booking status becomes "confirmed", update listing to "Reserved"
bookingSchema.post("save", async function (doc) {
  if (doc.status === "confirmed") {
    await Listing.findByIdAndUpdate(doc.listing, {
      status: "Reserved",
    });
  } else if (doc.status === "cancelled") {
    // 👇 Only reset listing to "Available" if there are no other active bookings
    const activeBookings = await mongoose.model("Booking").countDocuments({
      listing: doc.listing,
      status: { $in: ["confirmed", "checked-in"] },
    });

    if (activeBookings === 0) {
      await Listing.findByIdAndUpdate(doc.listing, {
        status: "Available",
      });
    }
  }
});
const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

import express from "express";
import Booking from "../models/Booking.js"; // Adjust the path as necessary
import { protect } from "../middlewares/auth.js";
import { Listing } from "../models/listing.js";

const router = express.Router();

// GET all bookings

router.use(protect);
router.get("/allBookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("user").populate("listing");
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

//check Status of booking
router.get("/checkStatus", async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, status: booking.status });
  } catch (err) {
    next(err);
  }
});
// GET a specific booking by ID
router.get("/get/:id", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user")
      .populate("listing");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// POST create a new booking
router.post("/createBooking", async (req, res, next) => {
  try {
    const { listingId, checkIn, checkOut } = req.body;
    let user = req.user._id;

    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Listing ID, check-in, and check-out dates are required",
      });
    }
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      listing: listingId,
      status: { $in: ["pending", "confirmed"] }, // can adjust based on your use case
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You have already send this Request.",
      });
    }

    const newBooking = new Booking({
      user,
      listing,
      checkIn,
      checkOut,
    });
    await newBooking.save();
    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    next(err);
  }
});

router.get("/getBookingByUser", async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const bookings = await Booking.find({ user: userId })
      .populate("user")
      .populate("listing");
    if (!bookings) {
      return res
        .status(404)
        .json({ success: false, message: "No bookings found for this user" });
    }
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});
// PUT update an existing booking
router.put("/updateBooking/:id", async (req, res, next) => {
  try {
    const { id: bookingId } = req.params;
    const { status, checkIn, checkOut } = req.body;

    // ✅ 1. Validate Input
    if (!status || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Status, check-in, and check-out dates are required",
      });
    }

    // ✅ 2. Role Check (make sure you’ve added auth middleware before this)
    if (req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only landlords can update bookings",
      });
    }

    // ✅ 3. Fetch booking and validate ownership
    const booking = await Booking.findById(bookingId)
      .populate("user")
      .populate("listing");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ 4. Prevent landlords from modifying bookings they don't own
    if (String(booking.listing.owner) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This listing does not belong to you",
      });
    }

    // ✅ 5. Update booking fields
    booking.status = status;
    booking.checkIn = new Date(checkIn);
    booking.checkOut = new Date(checkOut);

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (err) {
    console.error("Error updating booking:", err);
    return next(err);
  }
});

// DELETE a booking
router.delete("/deleteBooking/:id", async (req, res, next) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;

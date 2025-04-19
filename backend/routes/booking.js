import express from "express";
import Booking from "../models/Booking.js"; // Adjust the path as necessary
import { protect } from "../middlewares/auth.js";

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
    const { listing, checkIn, checkOut, status } = req.body;
    let user = req.user._id;
    const newBooking = new Booking({
      user,
      listing,
      checkIn,
      checkOut,
      status,
    });
    await newBooking.save();
    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    next(err);
  }
});

// PUT update an existing booking
router.put("/updateBooking/:id", async (req, res, next) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.json({ success: true, data: updatedBooking });
  } catch (err) {
    next(err);
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

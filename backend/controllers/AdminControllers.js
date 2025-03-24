// controllers/adminController.js

import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/user.js";
import { Listing } from "../models/listing.js";
import { KYC } from "../models/KYC.js";
import { sendToken } from "../utils/features.js";
import { configDotenv } from "dotenv";
configDotenv();
/**
 * Create Admin Account
 * Only an authenticated admin can create a new admin.
 * Expects: name, email, password, and optionally an admin invite code.
 */
const createAdmin = TryCatch(async (req, res, next) => {
  const { name, email, password, adminCode } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return next(
      new ErrorHandler(400, "Name, email, and password are required")
    );
  }

  // Verify the invitation code
  if (adminCode !== process.env.ADMIN_INVITE_CODE) {
    return next(new ErrorHandler(403, "Invalid admin invitation code"));
  }

  // Ensure the currently authenticated user is an admin
  const currentAdmin = await User.findById(req.user);
  if (!currentAdmin || currentAdmin.role !== "admin") {
    return next(new ErrorHandler(403, "Not authorized to create an admin"));
  }

  // Check if a user with the provided email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler(400, "Email already exists"));
  }

  // Create a new admin user
  const adminUser = new User({ name, email, password, role: "admin" });
  await adminUser.save();

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    adminUser,
  });
});

/**
 * Admin Login
 * Expects: email and password in req.body.
 * Only users with the admin role are allowed.
 */
const AdminLogin = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler(400, "Email and password are required"));
  }

  const adminUser = await User.findOne({ email }).select("+password");

  if (!adminUser) {
    return next(new ErrorHandler(404, "User not found"));
  }

  if (adminUser.role !== "admin") {
    return next(new ErrorHandler(403, "Not authorized: Admin access required"));
  }

  const isMatch = await adminUser.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorHandler(401, "Invalid credentials"));
  }

  sendToken(res, adminUser, 200, "Admin successfully logged in");
});

/**
 * Get Dashboard Statistics
 * Returns total users, total listings, and KYC record counts by status.
 */
const getDashboardStats = TryCatch(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalListings = await Listing.countDocuments();
  const kycPending = await KYC.countDocuments({ status: "pending" });
  const kycVerified = await KYC.countDocuments({ status: "Verified" });
  const kycRejected = await KYC.countDocuments({ status: "Rejected" });
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalListings,
      kyc: {
        pending: kycPending,
        verified: kycVerified,
        rejected: kycRejected,
      },
    },
  });
});

/**
 * Get All Users
 * Returns a list of users without sensitive fields.
 */
const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find().select("-password");
  res.status(200).json({ success: true, users });
});

/**
 * Update a User's Role
 * Expects: req.params.id for user ID, req.body.role (must be "tenant", "landlord", or "admin").
 */
const updateUserRole = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || !["tenant", "landlord"].includes(role)) {
    return next(new ErrorHandler(400, "Invalid role"));
  }
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password");
  if (!updatedUser) {
    return next(new ErrorHandler(404, "User not found"));
  }
  res.status(200).json({ success: true, user: updatedUser });
});

/**
 * Delete a User
 * Expects: req.params.id for user ID.
 */
const deleteUser = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    return next(new ErrorHandler(404, "User not found"));
  }
  res.status(200).json({ success: true, message: "User deleted successfully" });
});

/**
 * Get All Listings
 * Returns all listings with owner details.
 */
const getAllListings = TryCatch(async (req, res, next) => {
  const listings = await Listing.find().populate("owner", "name email");
  res.status(200).json({ success: true, listings });
});

/**
 * Update Listing Status
 * Expects: req.params.id for listing ID, req.body.status (must be one of "available", "pending", "approved", "rejected").
 */
const updateListingStatus = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (
    !status ||
    !["available", "pending", "approved", "rejected"].includes(status)
  ) {
    return next(new ErrorHandler(400, "Invalid status"));
  }
  const updatedListing = await Listing.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!updatedListing) {
    return next(new ErrorHandler(404, "Listing not found"));
  }
  res.status(200).json({ success: true, listing: updatedListing });
});

/**
 * Get All KYC Records
 * Returns all KYC records with user details.
 */
const getAllKYC = TryCatch(async (req, res, next) => {
  const kycRecords = await KYC.find().populate("user", "name email");
  res.status(200).json({ success: true, kycRecords });
});

/**
 * Manually Verify a KYC Record
 * Expects: req.params.id for KYC record ID and req.body.status (must be one of "Verified", "Rejected", or "Pending").
 */
const verifyKYCManually = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !["Verified", "Rejected", "Pending"].includes(status)) {
    return next(new ErrorHandler(400, "Invalid KYC status"));
  }
  const updatedKYC = await KYC.findByIdAndUpdate(id, { status }, { new: true });
  if (!updatedKYC) {
    return next(new ErrorHandler(404, "KYC record not found"));
  }
  res
    .status(200)
    .json({ success: true, message: "KYC status updated", kyc: updatedKYC });
});

export {
  createAdmin,
  AdminLogin,
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllListings,
  updateListingStatus,
  getAllKYC,
  verifyKYCManually,
};

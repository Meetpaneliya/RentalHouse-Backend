import express from "express";
import { protect, admin } from "../middlewares/auth.js"; // `admin` middleware verifies admin rights
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllListings,
  updateListingStatus,
  getAllKYC,
  verifyKYCManually,
  AdminLogin,
  createAdmin,
} from "../controllers/AdminControllers.js";

const router = express.Router();

// Public admin login route
router.post("/login", AdminLogin);

// The following routes require authentication and admin privileges.
router.use(protect);

// Create a new admin (only accessible by an already authenticated admin)
router.post("/createAdmin", createAdmin);

// Dashboard statistics
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Listing management
router.get("/listings", getAllListings);
router.put("/listings/:id/status", updateListingStatus);

// KYC management
router.get("/kyc", getAllKYC);
router.put("/kyc/:id/verify", verifyKYCManually);

export default router;

import express from "express";
import {
  getAllListings,
  getListingById,
  getUserListings,
  createListing,
  updateListing,
  deleteListing,
  searchListings,
  SearchNearbyListings,
} from "../controllers/listingController.js";
import { protect } from "../middlewares/auth.js"; // Assuming authentication middleware
import { attachmentsMulter } from "../utils/multer.js";
const router = express.Router();

router.get("/all", getAllListings);
router.get("/searchbyId/:id", getListingById);
router.get("/getuserlisting", protect, getUserListings); // Get user listings
router.get("/search", searchListings); // Search listings by query
router.get("/nearby", protect, SearchNearbyListings); // Search listings by location
router.post("/create", protect, attachmentsMulter, createListing); // Create listing
router.put("/update/:id", protect, updateListing); // Update listing
router.delete("/delete/:id", protect, deleteListing); // Delete listing

export default router;

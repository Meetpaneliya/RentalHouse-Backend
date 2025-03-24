import express from "express";
import { addReview,getReviewsByListing, getUserReviews, deleteReview } from "../controllers/reviewController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();


router.get("/:listingId", getReviewsByListing);
router.get("/", protect, getUserReviews);
router.post("/", protect, addReview);
router.delete("/:reviewId", protect, deleteReview);

export default router;

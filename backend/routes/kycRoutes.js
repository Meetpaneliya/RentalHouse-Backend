import express from "express";
import {
  createApplication,
  getKYCStatus,
  verifyKYC,
} from "../controllers/kycController.js";
import { protect } from "../middlewares/auth.js";
import { kycUpload } from "../utils/multer.js";

const router = express.Router();

router.post("/application", protect, kycUpload, createApplication);
router.get("/status", protect, getKYCStatus);

// dont use this as this is gonna get verified by admin
router.put("/verify", protect, verifyKYC);

export default router;

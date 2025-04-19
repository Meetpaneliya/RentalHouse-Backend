// paymentRoutes.js
import express from "express";

import { protect } from "../middlewares/auth.js";
import {
  createPayment,
  createPayPalPayment,
  createRazorpayPayment,
  verifyPaymentCancel,
  verifyPaymentSuccess,
  verifyRazorpayPayment,
  verifyStripePayment,
} from "../controllers/PaymentMeothod.js";

const router = express.Router();

// Create Payment Intent - Protected route so only authenticated users can pay
router.post("/stripe", protect, createPayment);
router.post("/stripe/verify", protect, verifyStripePayment);
router.post("/razorpay", protect, createRazorpayPayment);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/paypal", protect, createPayPalPayment);
router.get("payment/success", protect, verifyPaymentSuccess);
router.get("payment/cancel", protect, verifyPaymentCancel);

export default router;

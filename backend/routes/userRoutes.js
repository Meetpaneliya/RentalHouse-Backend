import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  changeProfilePicture,
  sendUserOTP,
} from "../controllers/userControllers.js";
import { protect } from "../middlewares/auth.js";
import { singlePhoto } from "../utils/multer.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/send-otp", sendUserOTP);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);
router.put("/update", protect, updateUser);
router.put("/update-image", protect, singlePhoto, changeProfilePicture);
router.delete("/delete", protect, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;

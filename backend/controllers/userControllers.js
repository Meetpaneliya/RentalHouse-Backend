// userController.js
import { User } from "../models/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendToken } from "../utils/features.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { configDotenv } from "dotenv";
import { cookieOptions } from "../middlewares/auth.js";
import { uploadFilesToCloudinary } from "../lib/helpers.js";
import { sendOTP, verifyOTP } from "../utils/OTPHelper.js";
configDotenv();

// Register User
const registerUser = TryCatch(async (req, res, next) => {
  const { name, email, password, role, otp } = req.body;

  if (!name || !email || !password || !role || !otp) {
    return next(new ErrorHandler(400, "All fields are required"));
  }
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler(400, "User already exists"));
  }
  const isOtpValid = verifyOTP(email, otp);
  if (!isOtpValid) {
    return next(new ErrorHandler(400, "Invalid OTP"));
  }
  try {
    user = await User.create({
      name,
      email,
      password,
      role,
      isVerified: true,
    });
    sendToken(res, user, 201, "User registered successfully");
  } catch (error) {
    return next(new ErrorHandler(500, "Error registering user", error));
  }
});

//send OTP to user email
const sendUserOTP = TryCatch(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler(400, "Email is required"));
  }

  try {
    await sendOTP(email);
    res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send OTP", error });
  }
});

// Login User
const loginUser = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler(400, "Please enter email & password"));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler(404, "Invalid email or password"));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new ErrorHandler(401, "Invalid email or password"));

  sendToken(res, user, 200, `Logged in successfully as ${email}`);
});

// Get Logged-in User
const getMe = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user).select("-password");
  if (!user) return next(new ErrorHandler(404, "User not found"));
  return res.status(200).json({ success: true, user });
});

// Update User
const updateUser = TryCatch(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });
  return res
    .status(200)
    .json({ success: true, message: "Profile updated", user });
});

// Delete User
const deleteUser = TryCatch(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  return res
    .status(200)
    .json({ success: true, message: "User deleted successfully" });
});

// update profile image
const changeProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadedImage = await uploadFilesToCloudinary([req.file]);

    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadedImage[0].url },
      { new: true }
    );

    return res.status(200).json({
      message: "Profile picture updated successfully",
      imageUrl: uploadedImage[0].url,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password
const forgotPassword = TryCatch(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler(404, "User not found"));

  // Generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Frontend URL (Make sure it's correct)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "StaySafe - Password Reset Request",
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2c3e50;">StaySafe - Password Reset</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>We received a request to reset your password. Click the button below to change your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1abc9c; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}" style="color: #3498db;">${resetUrl}</a></p>
          <p>If you didn’t request a password reset, you can safely ignore this email.</p>
          <br/>
          <p>Stay Safe,</p>
          <p><strong>The StaySafe Team</strong></p>
        </div>
      `,
    });
    

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    // If email sending fails, reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return next(
      new ErrorHandler(500, "Email could not be sent", error.message)
    );
  }
});

// Reset Password
const resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const { token } = req.params;

  if (!email || !password || !confirmPassword || !token) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.password = password; // Consider hashing before saving
    await user.save();

    sendToken(res, user, 200, "Password reset successfully!");
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const logoutUser = TryCatch(async (req, res) => {
  return res
    .status(200)
    .cookie("Auth-Token", " ", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "You have been logged out",
    });
});

export {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  changeProfilePicture,
  deleteUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  sendUserOTP,
};

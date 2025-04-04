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
configDotenv();
// Register User
const registerUser = TryCatch(async (req, res, next) => {
  const { name, email, password,role } = req.body;

  if (!name || !email || !password || !role) {
    return next(new ErrorHandler(400, "All fields are required"));
  }

  return sendOTP(req, res, next);
});


const sendOTP = TryCatch(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler(400, "Email is required"));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler(400, "User already exists"));
  }

  // Check if an OTP request already exists for this email
  const tempUser = await User.findOne({ email, otpExpiry: { $gt: Date.now() } });

  if (tempUser) {
    return next(new ErrorHandler(400, "OTP already sent. Try again after some time."));
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000);

  // 🔹 Hash OTP for security before storing
  const hashedOTP = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store hashed OTP in User collection (temporary entry)
  await User.findOneAndUpdate(
    { email },
    { email, otp: hashedOTP, otpExpiry, password: "temporary" },
    { upsert: true, new: true }
  );

  // Send OTP via email
  try {
    await sendEmail({
      email,
      subject: "Email Verification OTP",
      message: `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    await User.findOneAndDelete({ email }); // Remove temp user if OTP sending fails
    return next(new ErrorHandler(500, "Error sending OTP", error.message));
  }
});


const verifyOTP = TryCatch(async (req, res, next) => {
  const { email, otp, name, password, role } = req.body;

  if (!email || !otp || !name || !password || !role) {
    return next(new ErrorHandler(400, "All fields are required"));
  }

  // Find temporary user
  const tempUser = await User.findOne({
    email,
    otpExpiry: { $gt: Date.now() },
  }).select("+otp");

  if (!tempUser) {
    return next(new ErrorHandler(400, "OTP expired or invalid"));
  }

  // 🔹 Hash entered OTP for comparison
  const hashedOTP = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  // Verify OTP
  if (tempUser.otp !== hashedOTP) {
    return next(new ErrorHandler(400, "Invalid OTP"));
  }

  // 🔹 Hash the password before saving
  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  // Create actual user & remove temporary OTP
  await User.findOneAndUpdate(
    { email },
    { name, password: hashedPassword, role, otp: undefined, otpExpiry: undefined },
    { new: true }
  );

  sendToken(res, tempUser, 201, "User registered successfully");
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
      subject: "Password Reset Request",
      message: `Click the link to reset your password: ${resetUrl}`,
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    // If email sending fails, reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return next(new ErrorHandler(500, "Email could not be sent", error.message));
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

const logoutUser = TryCatch(async (req, res ) => {
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
  sendOTP,
  verifyOTP
};

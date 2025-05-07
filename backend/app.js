import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import { connectDB } from "./lib/db.js";
import { errorMiddleware } from "./middlewares/error.js";
import * as AdminJSMongoose from "@adminjs/mongoose";
import cookieParser from "cookie-parser";

// AdminJS setup
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { adminResources } from "./utils/adminResources.js";

// Load environment variables
dotenv.config({ path: "./.env" });
const app = express();

// Application setup
export const envMode = process.env.NODE_ENV || "DEVELOPMENT";
const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017";

// Connect to MongoDB
await connectDB(mongoURI);

// Register AdminJS adapter for Mongoose
AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

// Create the AdminJS instance and register resources
const admin = new AdminJS(adminResources);
admin.watch();

// Build and use the AdminJS router
const DEFAULT_ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "admin@example.com",
};

const authenticate = async (email, password) => {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
};

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate,
  cookieName: "adminjs",
  cookiePassword: "sessionsecret",
});

app.use(admin.options.rootPath, adminRouter);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Security & Middleware Setup
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rental-house-frontend.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  })
);
app.use(morgan("dev"));

// Import API Routes
import userRoutes from "./routes/userRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js"; // ✅ Fixed Spelling
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/Admin.js"; // ✅ Fixed Import
import kycRoutes from "./routes/kycRoutes.js";
import usePayment from "./routes/PaymentMethod.js";
import useBooking from "./routes/booking.js";

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/payments", usePayment);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/kyc", kycRoutes);
app.use("/api/v1/bookings", useBooking);

// Default Route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Handle 404 Errors
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});
// Error Middleware
app.use(errorMiddleware);

// Start server with port handling
const server = app
  .listen(port, () => {
    console.log(`Server running on Port: ${port} in ${envMode} Mode.`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      server.listen(port + 1);
    } else {
      console.error(err);
    }
  });

// Unhandled Promise Rejection Handler
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to Unhandled Promise Rejection");
  process.exit(1);
});

// Uncaught Exception Handler
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to Uncaught Exception");
  process.exit(1);
});
// import express from "express";
// import helmet from "helmet";
// import cors from "cors";
// import morgan from "morgan";
// import dotenv from "dotenv";
// import cloudinary from "cloudinary";
// import { connectDB } from "./lib/db.js";
// import { errorMiddleware } from "./middlewares/error.js";
// import { app, server } from "./lib/socket.js";
// import cookieParser from "cookie-parser";

// // Load environment variables
// dotenv.config({ path: "./.env" });

// export const envMode = process.env.NODE_ENV || "DEVELOPMENT";
// const port = process.env.PORT || 4000;
// const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017";
// // Connect to MongoDB
// connectDB(mongoURI);

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Security & Middleware Setup
// app.use(
//   helmet({
//     contentSecurityPolicy: false, // Adjust helmet settings for APIs
//     crossOriginEmbedderPolicy: false,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // CORS Configuration
// const corsOptions = {
//   origin:"http://localhost:5173",
//   credentials: true,
// };
// app.use(cors(corsOptions));

// app.use(morgan("dev"));

// // Import Routes
// import userRoutes from "./routes/userRoutes.js";
// import listingRoutes from "./routes/listingRoutes.js";
// import favoriteRotes from "./routes/favoriteRoutes.js";
// import reviewRoutes from "./routes/reviewRoutes.js";

// // Error Middleware
// app.use(errorMiddleware);

// // API Routes
// app.use("/api/v1/user", userRoutes);
// app.use("/api/v1/listings", listingRoutes);
// app.use("/api/v1/favorites", favoriteRotes);
// app.use("/api/v1/reviews", reviewRoutes);

// // Default Route
// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// // Handle 404 Errors
// app.all("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Page not found",
//   });
// });

// // Start Server
// server.listen(port, () =>
//   console.log(`Server running on Port: ${port} in ${envMode} Mode.`)
// );

// // Handle Uncaught Errors & Promise Rejections
// process.on("uncaughtException", (err) => {
//   console.error(` Uncaught Exception: ${err.message}`);
//   process.exit(1);
// });

// process.on("unhandledRejection", (err) => {
//   console.error(` Unhandled Promise Rejection: ${err.message}`);
// });

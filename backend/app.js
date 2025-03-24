import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import { connectDB } from "./lib/db.js";
import * as AdminJSMongoose from "@adminjs/mongoose";
import cookieParser from "cookie-parser";

// Import Models FIRST
import { User } from "./models/user.js";
import { Listing } from "./models/listing.js";
import { KYC } from "./models/KYC.js";

// AdminJS setup
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";

// Load environment variables
dotenv.config({ path: "./.env" });
const app = express();

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling for unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
  next(err); // Pass error to default Express error handler
});

// Register AdminJS adapter for Mongoose
AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

// Create the AdminJS instance and register resources
const admin = new AdminJS({
  rootPath: "/admin",
  resources: [
    {
      resource: User,
      options: {
        listProperties: ["name", "email", "role"],
        editProperties: ["name", "email", "password", "role"],
        showProperties: ["_id", "name", "email", "role", "createdAt"],
        filterProperties: ["name", "email", "role"],
      },
    },
    {
      resource: Listing,
      options: {
        properties: {
          "locationGeo.type": { label: "Geo Type" },
          "locationGeo.coordinates": { label: "Geo Coordinates" },
        },
        listProperties: ["title", "price", "status", "location"],
        editProperties: [
          "title",
          "description",
          "locationGeo.type",
          "locationGeo.coordinates",
          "status",
          "price",
          "size",
          "floor",
          "location",
          "images",
          "owner",
          "propertyType",
          "amenities",
          "rooms",
          "beds",
          "bathrooms",
        ],
        showProperties: [
          "_id",
          "title",
          "description",
          "locationGeo.type",
          "locationGeo.coordinates",
          "status",
          "price",
          "size",
          "floor",
          "location",
          "images",
          "owner",
          "propertyType",
          "amenities",
          "rooms",
          "beds",
          "bathrooms",
          "createdAt",
        ],
        filterProperties: ["status", "propertyType", "location"],
      },
    },
    {
      resource: KYC,
      options: {
        listProperties: ["user", "verificationType", "status"],
        editProperties: [
          "user",
          "verificationType",
          "ssn",
          "passportNumber",
          "passportDocument",
          "visaDocument",
          "status",
        ],
        showProperties: [
          "_id",
          "user",
          "verificationType",
          "ssn",
          "passportNumber",
          "passportDocument",
          "visaDocument",
          "status",
          "createdAt",
        ],
        filterProperties: ["verificationType", "status"],
        actions: {
          approve: {
            actionType: "record",
            icon: "Check",
            handler: async (request, response, context) => {
              const { record } = context;
              await record.update({ status: "approved" });
              return {
                record: record.toJSON(),
                notice: {
                  message: "KYC approved successfully",
                  type: "success",
                },
              };
            },
          },
          // You can add more custom actions here...
        },
      },
    },
    // Add more resources here...
    {
      resource: Review, // Register your Review model here
      options: {
        listProperties: ["user", "listing", "rating", "comment"],
        // Configure as needed
      },
    },
  ],
  locale: {
    language: "en",
    translations: {
      properties: {
        propertyType: "Property Type", // This maps the key to a human-friendly name.
      },
    },
  },
});

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

// Session options for AdminJS
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
  },
};

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate,
    cookieName: "adminjs",
    cookiePassword: process.env.ADMIN_COOKIE_SECRET || "your-secret",
  },
  null,
  sessionOptions
);
app.use(admin.options.rootPath, adminRouter);

// Application setup
export const envMode = process.env.NODE_ENV || "DEVELOPMENT";
const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017";

// Connect to MongoDB
try {
  await connectDB(mongoURI);
  console.log('Database connected successfully');
} catch (error) {
  console.error('Database connection failed:', error);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import API Routes
import userRoutes from "./routes/userRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js"; // ✅ Fixed Spelling
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/Admin.js"; // ✅ Fixed Import
import { Review } from "./models/Review.js";
import kycRoutes from "./routes/kycRoutes.js";
import usePayment from "./routes/PaymentMethod.js";

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/payments", usePayment);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/kyc", kycRoutes);

// Export for serverless use
export default app;

// Start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on Port: ${port} in ${envMode} Mode.`);
  });
}

// Handle Uncaught Errors & Promise Rejections
process.on("uncaughtException", (err) => {
  console.error(` Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(` Unhandled Promise Rejection: ${err.message}`);
});

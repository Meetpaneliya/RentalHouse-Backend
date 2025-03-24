import { KYC } from "../models/KYC.js";
import { TryCatch } from "../middlewares/error.js";

import { configDotenv } from "dotenv";
import ErrorHandler from "../utils/errorHandler.js";
import { uploadFilesToCloudinary } from "../lib/helpers.js";

configDotenv();

const createApplication = TryCatch(async (req, res, next) => {
  // Extract common fields from req.body
  const { verificationType, ssn, passportNumber } = req.body;
  const userId = req.user; // ensure req.user is set by auth middleware

  if (!userId) {
    return next(new ErrorHandler(401, "Unauthorized: Please log in"));
  }

  if (!verificationType || !["ssn", "passport"].includes(verificationType)) {
    return next(new ErrorHandler(400, "Invalid verification type"));
  }

  // Check if a KYC record already exists for the user
  const existingKYC = await KYC.findOne({ user: userId });
  if (existingKYC) {
    return res
      .status(400)
      .json({ success: false, message: "KYC already submitted" });
  }

  // For SSN verification: ensure ssn is provided.
  if (verificationType === "ssn") {
    if (!ssn) {
      return next(
        new ErrorHandler(400, "SSN is required for SSN verification")
      );
    }

    // Create the KYC record for SSN verification.
    const kyc = await KYC.create({
      user: userId,
      verificationType,
      ssn,
    });

    return res
      .status(201)
      .json({ success: true, message: "KYC submitted successfully", kyc });
  }

  // For Passport verification: ensure passportNumber and file uploads are provided.
  if (verificationType === "passport") {
    if (!passportNumber) {
      return next(new ErrorHandler(400, "Passport number is required"));
    }

    // Expect file uploads with keys "passportDoc" and "visaDoc"
    if (!req.files || !req.files.passportDoc || !req.files.visaDoc) {
      return next(
        new ErrorHandler(400, "Both passport and visa documents are required")
      );
    };

    // Upload files to Cloudinary (assuming uploadFilesToCloudinary can handle an array of files)
    const passportUpload = await uploadFilesToCloudinary(req.files.passportDoc);
    const visaUpload = await uploadFilesToCloudinary(req.files.visaDoc);

    // Assume our helper returns an array and we take the first element's URL
    const passportDocumentURL = passportUpload[0]?.url;
    const visaDocumentURL = visaUpload[0]?.url;

    if (!passportDocumentURL || !visaDocumentURL) {
      return next(new ErrorHandler(500, "File upload failed"));
    }

    // Create the KYC record for Passport verification.
    const kyc = await KYC.create({
      user: userId,
      verificationType,
      passportNumber,
      passportDocument: passportDocumentURL,
      visaDocument: visaDocumentURL,
    });

    return res
      .status(201)
      .json({ success: true, message: "KYC submitted successfully", kyc });
  }
});

// Get KYC status for a user
const getKYCStatus = TryCatch(async (req, res, next) => {
  const userId = req.user;
  const kyc = await KYC.findOne({ user: userId });

  if (!kyc)
    return res
      .status(404)
      .json({ success: false, message: "No KYC record found" });

  res.status(200).json({ success: true, kyc });
});

// Admin verifies KYC
const verifyKYC = TryCatch(async (req, res, next) => {
  const { status } = req.body;

  if (!["Pending", "Verified", "Rejected"].includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid KYC status" });
  }

  const updatedKYC = await KYC.findOneAndUpdate(
    { user: req.user },
    { status },
    { new: true }
  );

  if (!updatedKYC)
    return res
      .status(404)
      .json({ success: false, message: "KYC record not found" });

  res
    .status(200)
    .json({ success: true, message: "KYC status updated", kyc: updatedKYC });
});

export { createApplication, getKYCStatus, verifyKYC };

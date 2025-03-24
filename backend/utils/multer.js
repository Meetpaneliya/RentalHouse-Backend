import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix for ES Module (`__dirname` equivalent)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads"); // Ensure correct path
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save files to "uploads" folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
  },
});

const multerUpload = multer({
  storage, // Use disk storage
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new Error("Only images (JPEG, JPG, PNG, GIF) are allowed"));
    }
  },
});

const singlePhoto = multerUpload.single("profilePicture");
const attachmentsMulter = multerUpload.array("images", 5);
export { singlePhoto, attachmentsMulter };

/// kyc
const storage1 = multer.memoryStorage(); // Or use diskStorage if you prefer
const upload = multer({ storage1 });

// For passport KYC, expect two files: one for passport and one for visa.
export const kycUpload = upload.fields([
  { name: "passportDoc", maxCount: 1 },
  { name: "visaDoc", maxCount: 1 },
]);

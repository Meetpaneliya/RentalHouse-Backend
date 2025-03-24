import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadFilesToCloudinary = async (files = []) => {
  try {
    if (!files || files.length === 0) {
      throw new Error("No files provided for upload");
    }

    console.log("Files received for upload:", files.map(f => f.originalname));

    const uploadPromises = files.map(async (file, index) => {
      if (file.size > 1024 * 1024 * 5) {
        throw new Error(`File ${file.originalname} is too large (Max: 5MB)`);
      }

      return new Promise((resolve, reject) => {
        const uploadOptions = {
          resource_type: "auto",
          public_id: uuid(), // Generate unique ID
        };

        const uploadCallback = (error, result) => {
          if (error) {
            console.error(`Cloudinary Upload Error for ${file.originalname}:`, error);
            return reject(error);
          }
          console.log(`Cloudinary Upload Success for ${file.originalname}:`, result.secure_url);
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
          });
        };

        // Use correct upload method based on Multer storage type
        if (file.buffer) {
          // If using memoryStorage, upload using buffer
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, uploadCallback);
          uploadStream.end(file.buffer);
        } else if (file.path) {
          // If using diskStorage, upload using file path
          cloudinary.uploader.upload(file.path, uploadOptions, uploadCallback);
        } else {
          reject(new Error(`File ${file.originalname} is missing buffer or path`));
        }
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);
    console.log("Final Uploaded Images:", uploadedImages);
    return uploadedImages;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    throw new Error(error.message);
  }
};

export { uploadFilesToCloudinary };

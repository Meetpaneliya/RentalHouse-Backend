import { Listing } from "../models/listing.js";
import { Review } from "../models/Review.js";
import { TryCatch } from "../middlewares/error.js";
import { uploadFilesToCloudinary } from "../lib/helpers.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";

const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find(); // Fetch all listings from DB
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ message: "Error fetching listings" });
  }
};

const getListingById = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  // Fetch listing details
  const listing = await Listing.findById(id);

  if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
  }
  const reviews = await Review.find({ listing: id }).populate("user", "name email");
  res.json({ success: true, data: { listing, reviews } });
});

// Get Listings for a Specific User
const getUserListings = TryCatch(async (req, res, next) => {
  const userId = req.user;

  if (!userId)
    return next(
      new ErrorHandler(401, "Unauthorized: Please login to view your listings")
    );
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const listings = await Listing.find({ owner: userId })
    .skip(skip)
    .limit(limit)
    .populate("owner", "name email");

  if (!listings.length) {
    return res.status(200).json({
      success: true,
      message: "No listings found",
      listings: [],
    });
  }

  res.status(200).json({ success: true, page, listings });
});

// Create a New Listing
const createListing = TryCatch(async (req, res, next) => {
  const {
    title,
    description,
    price,
    size,
    floor,
    location,
    propertyType,
    amenities, // expecting a comma-separated string or an array
    rooms,
    beds,
    bathrooms,
    lat, // latitude to create locationGeo
    lng, // longitude to create locationGeo
  } = req.body;

  const images = req.files;

  // Basic validations
  if (!title || !description || !price || !location || !propertyType) {
    return next(
      new ErrorHandler(
        400,
        "Title, description, price, location, and property type are required"
      )
    );
  }
  if (!images || images.length === 0) {
    return next(new ErrorHandler(400, "At least one image is required"));
  }
  if (!lat || !lng) {
    return next(
      new ErrorHandler(
        400,
        "Latitude and Longitude are required for locationGeo"
      )
    );
  }

  // Upload images to Cloudinary
  const uploadedImages = await uploadFilesToCloudinary(images);

  // Create the GeoJSON location from lat & lng
  const locationGeo = {
    type: "Point",
    coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON expects [lng, lat]
  };

  // If amenities is a comma-separated string, convert to array
  const amenitiesArray =
    typeof amenities === "string"
      ? amenities.split(",").map((a) => a.trim())
      : amenities;

  const newListing = await Listing.create({
    title,
    description,
    price,
    size,
    floor,
    location,
    locationGeo,
    images: uploadedImages,
    owner: req.user,
    propertyType,
    amenities: amenitiesArray,
    rooms: rooms || 1,
    beds: beds || 1,
    bathrooms: bathrooms || 1,
    // rating and reviewsCount will use defaults (0)
  });

  res.status(201).json({ success: true, listing: newListing });
});

// Search Query for Listings
const searchListings = TryCatch(async (req, res, next) => {
  const {
    q,
    priceMin,
    priceMax,
    location,
    propertyType,
    ratingMin,
    amenities,
  } = req.query;

  const filter = {};

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }

  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  if (propertyType) {
    filter.propertyType = propertyType; // exact match for property type
  }

  if (ratingMin) {
    filter.rating = { $gte: Number(ratingMin) };
  }

  if (amenities) {
    const amenityArray = amenities.split(",").map((a) => a.trim());
    filter.amenities = { $all: amenityArray };
  }

  const listings = await Listing.find(filter).populate("owner", "name email");
  res.json({ success: true, data: listings });
});

// Search Nearby Listings using GeoJSON and 2dsphere index
const SearchNearbyListings = TryCatch(async (req, res, next) => {
  const { lat, lng, maxDistance } = req.query;

  if (!lat || !lng) {
    return next(new ErrorHandler(400, "Latitude and Longitude are required"));
  }

  const maxDist = maxDistance ? Number(maxDistance) : 10000; // Default 10 km

  const listings = await Listing.find({
    locationGeo: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: maxDist,
      },
    },
  }).populate("owner", "name email");

  res.json({ success: true, data: listings });
});

// Update an Existing Listing
const updateListing = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  let listing = await Listing.findById(id);
  if (!listing)
    return res
      .status(404)
      .json({ success: false, message: "Listing not found" });

  // Ensure only the owner can update
  if (listing.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this listing",
    });
  }

  let updatedData = { ...req.body };

  // If lat and lng are provided, update locationGeo
  if (req.body.lat && req.body.lng) {
    updatedData.locationGeo = {
      type: "Point",
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    };
  }

  // If amenities is provided as a comma-separated string, convert to array
  if (updatedData.amenities && typeof updatedData.amenities === "string") {
    updatedData.amenities = updatedData.amenities
      .split(",")
      .map((a) => a.trim());
  }

  // Handle image updates if files are provided
  if (req.files && req.files.length > 0) {
    const uploadedImages = await uploadFilesToCloudinary(req.files);
    updatedData.images = uploadedImages.map((img) => ({
      public_id: img.public_id,
      url: img.url,
    }));
  }

  const updatedListing = await Listing.findByIdAndUpdate(id, updatedData, {
    new: true,
  });

  res.status(200).json({ success: true, listing: updatedListing });
});

// Delete a Listing
const deleteListing = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing)
    return res
      .status(404)
      .json({ success: false, message: "Listing not found" });

  if (listing.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this listing",
    });
  }

  // Delete images from Cloudinary if available
  if (listing.images && listing.images.length > 0) {
    await Promise.all(
      listing.images.map((img) => cloudinary.uploader.destroy(img.public_id))
    );
  }
  await Listing.findByIdAndDelete(id);

  res
    .status(200)
    .json({ success: true, message: "Listing deleted successfully" });
});

export {
  getAllListings,
  getListingById,
  getUserListings,
  createListing,
  updateListing,
  deleteListing,
  searchListings,
  SearchNearbyListings,
};

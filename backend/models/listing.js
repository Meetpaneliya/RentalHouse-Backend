import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    // Remove separate lat & lng fields in favor of a GeoJSON field:
    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: { type: String, default: "Available" },
    price: { type: Number ,required: true},
    size: { type: Number},
    floor: { type: Number },
    location: { type: String, required: true },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Additional fields for a rental hotel website
    propertyType: {
      type: String,
      enum: ["hotel", "apartment"],
      required: true,
    },
    amenities: [{ type: String }],
    rooms: { type: Number, default: 1 },
    beds: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  { timestamps: true }
);

// Create a 2dsphere index on locationGeo for geospatial queries
ListingSchema.index({ locationGeo: "2dsphere" });

export const Listing = mongoose.model("Listing", ListingSchema);

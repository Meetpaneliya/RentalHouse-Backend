import { fileURLToPath } from "url";
import Booking from "../models/Booking.js";
import { KYC } from "../models/KYC.js";
import { Listing } from "../models/listing.js";
import { Payment, Payout } from "../models/PaymentCheckouts.js";
import { Review } from "../models/Review.js";
import { User } from "../models/user.js";
import { Components, componentLoader } from "../src/component.js";
import path from "path";
import { request } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const adminResources = {
  rootPath: "/admin",
  dashboard: {
    component: Components.Dashboard,
    handler: async (request, response, context) => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthRevenue = await Payment.aggregate([
        { $match: { status: "completed", createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const lastMonthRevenue = await Payment.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: lastMonth, $lt: thisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const current = thisMonthRevenue[0]?.total || 0;
      const previous = lastMonthRevenue[0]?.total || 0;

      const growth =
        previous === 0 ? 100 : ((current - previous) / previous) * 100;

      const totalRevenue = await Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const totalLandlords = await User.countDocuments({ role: "landlord" });
      const totalUsers = await User.countDocuments();

      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
          name: date.toLocaleString("default", { month: "short" }),
        };
      });

      const chartData = await Promise.all(
        months.map(async (month) => {
          const revenueAgg = await Payment.aggregate([
            {
              $match: {
                status: "completed",
                createdAt: { $gte: month.start, $lt: month.end },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]);

          const landlordCount = await User.countDocuments({
            role: "landlord",
            createdAt: { $gte: month.start, $lt: month.end },
          });

          return {
            name: month.name,
            sales: revenueAgg[0]?.total || 0,
            landlords: landlordCount,
          };
        })
      );

      response.json({
        totalRevenue: totalRevenue[0]?.total || 0,
        totalLandlords,
        totalUsers,
        growth: growth.toFixed(2),
        chartData,
      });
    },
  },
  branding: {
    companyName: "Cozzi Roam", // Your custom title/logo text
    logo: false,
    softwareBrothers: false,
  },
  resources: [
    {
      // 1. General Users
      resource: User,
      options: {
        navigation: { icon: "Users" },
        listProperties: ["name", "email", "role"],
        editProperties: ["name", "email", "password", "role"],
        showProperties: ["_id", "name", "email", "role", "createdAt"],
        filterProperties: ["name", "email", "role"],
        options: {
          actions: {
            new: { isVisible: false },
          },
        },
        properties: {
          name: {
            type: "string",
            components: {
              edit: Components.MyInput,
            },
          },
        },
      },
    },
    {
      resource: User,
      options: {
        id: "Land Lords",
        navigation: { icon: "Home" },
        listProperties: ["name", "email", "role", "revenue"], // <-- Show revenue
        showProperties: ["name", "email", "role", "revenue"],
        filterProperties: ["name", "email"],
        properties: {
          revenue: {
            isVisible: { list: true, filter: false, show: true, edit: false },
            type: "number",
            label: "Revenue",
            components: {
              show: Components.LandlordRevenueGraph,
            },
          },
        },
        actions: {
          list: {
            isAccessible: true,
            before: async (request) => {
              if (
                request.method === "get" &&
                (!request.query?.filters ||
                  Object.keys(request.query.filters).length === 0)
              ) {
                request.query = {
                  ...request.query,
                  filters: {
                    role: "landlord",
                  },
                };
              }
              return request;
            },
            after: async (response) => {
              if (response.records?.length) {
                for (const record of response.records) {
                  const userId = record.params._id;
                  if (!userId) continue;

                  // Get all listings of the landlord
                  const listings = await Listing.find({ owner: userId }).select(
                    "_id"
                  );
                  const listingIds = listings.map((l) => l._id);

                  // Get payments for these listings
                  const payments = await Payment.find({
                    listing: { $in: listingIds },
                    status: "completed",
                  });

                  // Calculate total revenue
                  const totalRevenue = payments.reduce(
                    (sum, p) => sum + (p.amount || 0),
                    0
                  );

                  // Calculate total bookings (number of payments)
                  const totalBookings = payments.length;

                  // Calculate average occupancy
                  const totalOccupancy = payments.reduce((sum, p) => {
                    // Assuming 1 booking per payment
                    return sum + 1;
                  }, 0);
                  const averageOccupancy =
                    totalBookings > 0
                      ? (totalOccupancy / totalBookings) * 100
                      : 0;

                  // Set historical data
                  const historicalData = payments.map((payment) => ({
                    date: payment.createdAt,
                    revenue: payment.amount,
                    bookings: 1,
                    occupancyRate: payment.amount > 0 ? 100 : 0,
                  }));

                  // Add the calculated data to the record
                  record.params.revenue = totalRevenue;
                  record.params.totalBookings = totalBookings;
                  record.params.averageOccupancy = averageOccupancy;
                  record.params.historicalData = historicalData;
                }
              }

              return response;
            },
          },
        },
      },
    },

    {
      resource: Listing,
      options: {
        navigation: { icon: "Home" },
        properties: {
          "locationGeo.type": { label: "Geo Type" },
          "locationGeo.coordinates": { label: "Geo Coordinates" },
        },
        listProperties: [
          "title",
          "price",
          "status",
          "location",
          "adminApproved",
          "viewCount",
        ],
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
          "adminApproved",
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
          "viewCount",
          "createdAt",
          "adminApproved",
        ],
        filterProperties: [
          "status",
          "propertyType",
          "location",
          "viewCount",
          "adminApproved",
        ],
        actions: {
          viewListing: {
            actionType: "record",
            label: "View Listing",
            icon: "Eye",
            showInDrawer: true,
            component: Components.ListingShow,
            handler: async (request, response, context) => {
              const { record, h } = context;
              return {
                record: record.toJSON(h),
                notice: {
                  message: "Listing record loaded successfully",
                  type: "success",
                },
              };
            },
          },
          approve: {
            actionType: "record",
            icon: "Check",
            component: Components.ApproveSuccess,
            handler: async (request, response, context) => {
              const { record } = context;
              if (!record) {
                throw new Error("Record not found");
              }

              await record.update({ adminApproved: true });
              const listingId = record.param("listing");

              await Listing.findByIdAndUpdate(listingId, {
                adminApproved: true,
              });
              return {
                record: record.toJSON(),
                notice: {
                  message:
                    "Listing approved successfully and user status updated",
                  type: "success",
                },
              };
            },
          },
        },
      },
    },

    {
      resource: KYC,
      options: {
        navigation: { icon: "Shield" },
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
          new: { isVisible: false },
          viewKYC: {
            actionType: "record",
            label: "View KYC",
            icon: "Eye",
            showInDrawer: true,
            component: Components.KYCShow,
            handler: async (request, response, context) => {
              const { record, h } = context;
              return {
                record: record.toJSON(h),
                notice: {
                  message: "KYC record loaded successfully",
                  type: "success",
                },
              };
            },
          },
          approve: {
            actionType: "record",
            icon: "Check",
            component: Components.ApproveSuccess,
            handler: async (request, response, context) => {
              const { record, h } = context;

              if (!record) {
                throw new Error("Record not found");
              }

              // Update KYC status
              await record.update({ status: "approved" });

              // Get the User ID from the KYC record
              const userId = record.param("user");

              // Update the user's kycStatus field
              await User.findByIdAndUpdate(userId, { kycStatus: "verified" });

              return {
                record: record.toJSON(),
                notice: {
                  message: "KYC approved successfully and user status updated",
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
        navigation: { icon: "Star" },
        listProperties: ["user", "listing", "rating", "comment"],
        // Configure as needed
      },
    },
    {
      resource: Booking,
      options: {
        navigation: { icon: "Calendar" },
        listProperties: ["user", "listing", "checkIn", "checkOut", "status"],
        showProperties: [
          "user",
          "listing",
          "checkIn",
          "checkOut",
          "status",
          "createdAt",
          "updatedAt",
        ],
        editProperties: ["status"],
        populate: ["user", "listing"], // 🔥 Auto-populate user and listing
      },
    },
    {
      resource: Payment,
      options: {
        navigation: { icon: "CreditCard" },
        listProperties: [
          "user",
          "listing",
          "amount",
          "checkIn",
          "checkOut",
          "currency",
          "gateway",
          "status",
          "transactionId",
        ],
        showProperties: [
          "_id",
          "user",
          "listing",
          "amount",
          "checkIn",
          "checkOut",
          "currency",
          "gateway",
          "status",
          "transactionId",
          "createdAt",
        ],
        editProperties: ["status"],
        filterProperties: ["status", "gateway"],
      },
    },
  ],
  componentLoader,
  locale: {
    language: "en",
    translations: {
      properties: {
        propertyType: "Property Type",
      },
    },
  },
};

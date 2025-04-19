// seedBookings.js
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import Booking from "../models/Booking.js";
import { User } from "../models/user.js";
import { Listing } from "../models/listing.js";

export async function seedBookings() {
  try {
    const users = await User.find();
    const listings = await Listing.find({ status: "Available" });

    if (!users.length || !listings.length) {
      console.log("❌ Add users or listings first.");
      return;
    }

    for (let i = 0; i < 20; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomListing = faker.helpers.arrayElement(listings);

      const checkIn = faker.date.soon(10);
      const checkOut = new Date(checkIn);
      checkOut.setDate(
        checkOut.getDate() + faker.number.int({ min: 2, max: 7 })
      );

      const booking = new Booking({
        user: randomUser._id,
        listing: randomListing._id,
        checkIn,
        checkOut,
        status: faker.helpers.arrayElement([
          "pending",
          "confirmed",
          "cancelled",
          "checked-in",
          "checked-out",
        ]),
      });

      await booking.save();
      console.log(`✅ Booking ${i + 1} saved`);
    }

    console.log("🌱 Seeding complete");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

import { faker } from "@faker-js/faker";
import { Listing } from "../models/listing.js"; // Adjust path if needed
import { User } from "../models/user.js"; // Adjust path if needed

export const seedListings = async () => {
  try {
    // Fetch existing users to assign as owners
    const users = await User.find();
    if (!users.length) {
      console.log("No users found. Please seed users first.");
      process.exit(1);
    }

    const propertyTypes = [
      "hotel",
      "apartment",
      "hostel",
      "bed and breakfast",
      "villa",
    ];
    const amenitiesList = [
      "WiFi",
      "Pool",
      "Gym",
      "Parking",
      "Breakfast Included",
      "Air Conditioning",
      "Pet Friendly",
    ];

    const listings = [];
    const numberOfListings = 50; // Adjust number as needed

    for (let i = 0; i < numberOfListings; i++) {
      // Pick a random owner from existing users
      const randomOwner = users[Math.floor(Math.random() * users.length)];

      // Choose a random property type
      const propertyType = faker.helpers.arrayElement(propertyTypes);

      // Pick a random number of amenities (between 2 and 5) from the amenitiesList
      const amenities = faker.helpers.arrayElements(
        amenitiesList,
        faker.number.int({ min: 2, max: 5 })
      );

      // Generate random latitude and longitude using Faker's location methods
      const lat = parseFloat(faker.location.latitude());
      const lng = parseFloat(faker.location.longitude());

      listings.push({
        title: faker.lorem.words(3),
        description: faker.lorem.sentences(2),
        price: Number(faker.commerce.price({ min: 100, max: 5000 })), // convert string to number
        location: faker.location.city(),
        locationGeo: {
          type: "Point",
          coordinates: [lng, lat], // GeoJSON expects [lng, lat]
        },
        images: Array.from({ length: 3 }, () => faker.image.url()),
        status: "available",
        owner: randomOwner._id,
        propertyType,
        amenities,
        rooms: faker.number.int({ min: 1, max: 5 }),
        beds: faker.number.int({ min: 1, max: 5 }),
        bathrooms: faker.number.int({ min: 1, max: 3 }),
        rating: parseFloat(
          faker.number.float({ min: 0, max: 5, precision: 0.1 }).toFixed(1)
        ),
        reviewsCount: faker.number.int({ min: 0, max: 100 }),
      });
    }

    await Listing.insertMany(listings);
    console.log("Seeded Listings Successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding listings:", error);
    process.exit(1);
  }
};

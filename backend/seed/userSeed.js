import { faker } from "@faker-js/faker";
import { User } from "../models/user.js"; // Adjust path if needed
import bcrypt from "bcryptjs"; // Adjust path if needed
export const seedUsers = async () => {
  try {
    // Define possible roles; you have "tenant", "landlord", and "admin"
    const roles = ["tenant", "landlord", "admin"];
    const numberOfUsers = 50; // Adjust the number as needed
    const users = [];

    for (let i = 0; i < numberOfUsers; i++) {
      const role = faker.helpers.arrayElement(roles);
      const name = faker.person.fullName();
      const email = faker.internet.email();
      // Use a fixed password for all seeded users
      const password = await bcrypt.hash("password", 10);
      // Generate a fake avatar image URL for profilePicture
      const profilePicture = faker.image.avatar();

      users.push({
        name,
        email,
        password,
        role,
        profilePicture,
        isVerified: faker.datatype.boolean(),
        kycStatus: faker.helpers.arrayElement([
          "pending",
          "verified",
          "rejected",
        ]),
      });
    }

    // Insert the generated users into the database
    await User.insertMany(users);
    console.log("Seeded Users Successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

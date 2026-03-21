import bcrypt from "bcrypt";
import dotenv from "dotenv";
import sequelize from "../Config/db.js";
import { createUser, findUserByUsername } from "../Services/userService.js";

dotenv.config();

const addUsers = async () => {
  const usersToCreate = [
    { username: "superadmin", password: "0101", role: "superadmin" },
  ];

  for (const user of usersToCreate) {
    try {
      const existingUser = await findUserByUsername(user.username);
      if (existingUser) {
        console.log(`User already exists: ${existingUser.username}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const createdUser = await createUser(
        user.username,
        hashedPassword,
        user.role,
        user.password,
        null,
      );

      console.log(`Created ${user.role}: ${createdUser.username}`);
    } catch (err) {
      const validationMessage =
        err?.errors?.map((error) => error.message).join(", ") || err.message;
      console.error(
        `Error creating ${user.role} (${user.username}): ${validationMessage}`,
      );
    }
  }
};

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await addUsers();
  } catch (err) {
    console.error(`Failed to seed admin users: ${err.message}`);
  } finally {
    await sequelize.close();
  }
})();

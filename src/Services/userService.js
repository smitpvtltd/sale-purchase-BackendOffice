import User from "../Models/userModel.js";

// create user
export const createUser = async (username, hashedPassword, role = "admin", visiblePassword = "") => {
  return await User.create({
    username,
    password: hashedPassword,
    visiblePassword,  // store raw password if needed (⚠️ avoid in production)
    role,
  });
};

// Find user by username
export const findUserByUsername = async (username) => {
  return await User.findOne({ where: { username } });
};

// Find user by userId
export const findUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: ["id", "username", "password", "role"],
    // Again, consider removing 'password' in production
  });
};

// get all user
export const getAllUsers = async (id) => {
  return await User.findByPk(id);
};

// edit user
export const updateUser = async (id, username, role) => {
  const user = await findUserById(id);
  if (!user) return null;
  user.username = username;
  user.role = role;
  await user.save();
  return user;
};

// delete user
export const deleteUser = async (id) => {
  const user = await findUserById(id);
  if (!user) return null;
  await user.destroy();
  return user;
};

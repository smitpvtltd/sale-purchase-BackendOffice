import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  findUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  findUserById,
} from "../Services/userService.js";
import User from "../Models/userModel.js";
import Firm from "../Models/firmModel.js";

// login user
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required." });

  try {
    const user = await findUserByUsername(username);

    if (!user)
      return res.status(401).json({ message: "Invalid username or password." });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      role: user.role,
      username: user.username,
      userId: user.id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// get all user (using ID)
export const getAllUser = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// New controller to get users based on role and userId
export const getUsers = async (req, res) => {
  const { userId, role } = req.query;

  try {
    if (role === "superadmin") {
      // ✅ Return all users (including password — WARNING: not safe for production)
      const users = await User.findAll({
        attributes: ["id", "username", "password", "role"],
        // 🔐 In production, use: ['id', 'username', 'role']
      });
      return res.status(200).json(users);
    } else {
      // Return only user matching userId
      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      return res.status(200).json([user]); // as array for frontend consistency
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Edit user
export const editUser = async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: "Username and role are required." });
  }

  try {
    const updated = await updateUser(id, username, role);
    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User updated.", user: updated });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ✅ Delete user
export const removeUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User deleted.", user: deleted });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//get firm
export const getAllFirms = async (req, res) => {
  try {
    const firms = await Firm.findAll({
      include: [{
        model: User,
        attributes: ["id", "username"],  // Get admin user info
      }],
    });

    // Map response to include userId at root level
    const firmsWithUserId = firms.map(firm => ({
      id: firm.id,
      firmName: firm.firmName,
      firmLogo: firm.firmLogo,
      userId: firm.User.id,  // add userId here for frontend
    }));

    res.status(200).json(firmsWithUserId);
  } catch (err) {
    res.status(500).json({ message: "Error fetching firms" });
  }
};

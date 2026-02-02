import {
  createFirm,
  getAllFirms,
  getFirmById,
  updateFirm,
  deleteFirm,
} from "../Services/firmService.js";
import bcrypt from "bcrypt";
import User from "../Models/userModel.js"; // Import User model
import { createUser, findUserByUsername } from "../Services/userService.js";
import Firm from "../Models/firmModel.js";

// controllers/firmController.js
export const addFirm = async (req, res) => {
  try {
    const firmData = { ...req.body };
    const { firmUsername, firmPassword } = firmData;

    const loggedInUser = req.user; // { id, role, username }
    let userId;

    // 🔐 SUPERADMIN
    if (loggedInUser.role === "superadmin") {
      if (firmUsername && firmPassword) {
        const existingUser = await findUserByUsername(firmUsername);
        if (existingUser) {
          return res.status(409).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(firmPassword, 10);

        const newUser = await createUser(
          firmUsername,
          hashedPassword,
          "admin", // role for firm user
          firmPassword, // visiblePassword
          loggedInUser.id, // 👈 pass superadmin's id as createdBy
        );

        userId = newUser.id;
      }
    }

    // 🔐 ADMIN
    else if (loggedInUser.role === "admin") {
      if (!firmUsername || !firmPassword) {
        return res.status(400).json({
          message: "Admins must provide username & password for each firm",
        });
      }

      const existingUser = await findUserByUsername(firmUsername);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(firmPassword, 10);

      const newUser = await createUser(
        firmUsername,
        hashedPassword,
        "admin",
        firmPassword,
        req.user.id // 👈 pass admin's id as createdBy
      );

      userId = newUser.id;
    }

    // ❌ Unauthorized role
    else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    // 🖼️ Handle firm logo
    if (req.file) {
      firmData.firmLogo = req.file.filename;
    }

    // Assign userId to firm
    firmData.userId = userId;

    // 🏗️ Create firm
    const firm = await createFirm(firmData);

    res.status(201).json({
      message: "Firm and user created successfully",
      firm,
    });
  } catch (error) {
    console.error("Add Firm Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const getFirms = async (req, res) => {
  try {
    const { id, role } = req.user; // logged-in user's id and role

    let firms;

    if (role === "superadmin") {
      // SUPERADMIN → get all firms
      firms = await Firm.findAll({
        include: [
          {
            model: User,
            attributes: ["id", "username", "visiblePassword"],
          },
        ],
        order: [["id", "DESC"]],
      });
    } else if (role === "admin") {
  // 1️⃣ Users created by this admin
  const usersCreatedByAdmin = await User.findAll({
    where: { createdBy: id },
    attributes: ["id"],
  });

  const childUserIds = usersCreatedByAdmin.map((u) => u.id);

  // 2️⃣ Include admin's own userId ALSO
  const allowedUserIds = [id, ...childUserIds];

  firms = await Firm.findAll({
    where: {
      userId: allowedUserIds,
    },
    include: [
      {
        model: User,
        attributes: ["id", "username", "visiblePassword"],
      },
    ],
    order: [["id", "DESC"]],
  });
} else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.status(200).json(firms);
  } catch (error) {
    console.error("Get Firms Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSingleFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const firm = await getFirmById(id);
    if (!firm) return res.status(404).json({ message: "Firm not found." });
    res.status(200).json(firm);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const editFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.firmLogo = req.file.filename;
    }

    const firm = await updateFirm(id, updatedData);
    if (!firm) return res.status(404).json({ message: "Firm not found." });

    res.status(200).json({ message: "Firm updated successfully.", firm });
  } catch (error) {
    console.error("Edit Firm Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// export const removeFirm = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await deleteFirm(id);
//     if (!deleted) return res.status(404).json({ message: 'Firm not found.' });
//     res.status(200).json({ message: 'Firm deleted.', firm: deleted });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error.' });
//   }
// };
export const removeFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFirm(id);
    if (!deleted) return res.status(404).json({ message: "Firm not found." });

    res.status(200).json({ message: "Firm deleted.", firm: deleted });
  } catch (error) {
    console.error("❌ Remove Firm Controller Error:", error); // <== More detailed log
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

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
import {
  createTenantFirm,
  createTenantWorkspaceUser,
  deleteTenantFirm,
  findAnyTenantWorkspaceUserByUsername,
  getTenantFirmById,
  getTenantFirmsByUserId,
  updateTenantFirm,
} from "../Services/tenantDbService.js";

const getFirmLogoPath = (file) => (file ? `uploads/firm/${file.filename}` : undefined);
const isTenantFirmAdmin = (user) =>
  user?.role === "admin" && Boolean(user?.tenantOwnerId) && Boolean(user?.workspaceUserId);

// controllers/firmController.js
export const addFirm = async (req, res) => {
  try {
    const firmData = { ...req.body };
    const { firmUsername, firmPassword } = firmData;
    delete firmData.firmUsername;
    delete firmData.firmPassword;

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

    else if (isTenantFirmAdmin(loggedInUser)) {
      return res.status(403).json({ message: "Firm users cannot create firms." });
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

    // CLIENT
    else if (loggedInUser.role === "client") {
      if (!firmUsername || !firmPassword) {
        return res.status(400).json({
          message: "Clients must provide username & password for each firm",
        });
      }

      const existingUser = await findUserByUsername(firmUsername);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingTenantUser = await findAnyTenantWorkspaceUserByUsername(
        firmUsername,
        "admin",
        { activeClientsOnly: false },
      );
      if (existingTenantUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(firmPassword, 10);
      const tenantFirmUser = await createTenantWorkspaceUser(loggedInUser.id, {
        username: firmUsername,
        password: hashedPassword,
        visiblePassword: firmPassword,
        role: "admin",
        isActive: true,
        createdBy: loggedInUser.id,
      });

      userId = tenantFirmUser.id;
    }
    // ❌ Unauthorized role
    else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    // 🖼️ Handle firm logo
    if (req.file) {
      firmData.firmLogo = getFirmLogoPath(req.file);
    }

    // Assign userId to firm
    firmData.userId = userId;

    if (loggedInUser.role === "client") {
      const tenantFirm = await createTenantFirm(loggedInUser.id, firmData);
      return res.status(201).json({
        message: "Firm created successfully in client database",
        firm: tenantFirm,
        firmUser: {
          username: firmUsername,
          role: "admin",
        },
      });
    }

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
    } else if (isTenantFirmAdmin(req.user)) {
      firms = await getTenantFirmsByUserId(id, req.user.workspaceUserId);
    } else if (role === "admin") {
      const usersCreatedByAdmin = await User.findAll({
        where: { createdBy: id },
        attributes: ["id"],
      });

      const childUserIds = usersCreatedByAdmin.map((u) => u.id);
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
    } else if (role === "client") {
      firms = await getTenantFirmsByUserId(id);
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
    if (req.user.role === "client" || isTenantFirmAdmin(req.user)) {
      const tenantFirm = await getTenantFirmById(
        req.user.id,
        id,
        isTenantFirmAdmin(req.user) ? req.user.workspaceUserId : null,
      );
      if (!tenantFirm) {
        return res.status(404).json({ message: "Firm not found." });
      }
      return res.status(200).json(tenantFirm);
    }

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
      updatedData.firmLogo = getFirmLogoPath(req.file);
    }

    const firm =
      req.user.role === "client" || isTenantFirmAdmin(req.user)
        ? await updateTenantFirm(
            req.user.id,
            id,
            updatedData,
            isTenantFirmAdmin(req.user) ? req.user.workspaceUserId : null,
          )
        : await updateFirm(id, updatedData);
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
    const deleted =
      req.user.role === "client" || isTenantFirmAdmin(req.user)
        ? await deleteTenantFirm(
            req.user.id,
            id,
            isTenantFirmAdmin(req.user) ? req.user.workspaceUserId : null,
          )
        : await deleteFirm(id);
    if (!deleted) return res.status(404).json({ message: "Firm not found." });

    res.status(200).json({ message: "Firm deleted.", firm: deleted });
  } catch (error) {
    console.error("❌ Remove Firm Controller Error:", error); // <== More detailed log
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

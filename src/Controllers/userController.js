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
import {
  buildClientDatabaseName,
  createClientDatabase,
  writeClientConfig,
} from "../Services/clientConfigService.js";
import {
  findAnyTenantWorkspaceUserByUsername,
  getTenantContext,
  initializeTenantDatabase,
} from "../Services/tenantDbService.js";

const getClientLogoPath = (file) => (file ? `uploads/client/${file.filename}` : undefined);
const isBcryptHash = (value) => typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);

const getClientResponse = (user, config = null) => ({
  id: user.id,
  clientName: user.clientName,
  contact: user.contact,
  email: user.email,
  clientLogo: user.clientLogo,
  username: user.username,
  role: user.role,
  expiresAt: user.expiresAt,
  isActive: user.isActive,
});

// login user
// export const login = async (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password)
//     return res.status(400).json({ message: "Username and password required." });

//   try {
//     const user = await findUserByUsername(username);

//     if (!user)
//       return res.status(401).json({ message: "Invalid username or password." });

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch)
//       return res.status(401).json({ message: "Invalid username or password." });

//     const token = jwt.sign(
//       { id: user.id, username: user.username, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       token,
//       role: user.role,
//       username: user.username,
//       userId: user.id,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Server error." });
//   }
// };

// login user with firm name for admin
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required." });

  try {
    let user = await findUserByUsername(username);
    let tenantOwnerId = null;
    let tenantWorkspaceUserId = null;
    let tenantFirmName = null;

    console.info(`[login] Attempt started for username="${username}"`);

    if (user) {
      console.info(
        `[login] Username "${username}" found in main users table with role="${user.role}" and id=${user.id}.`,
      );
    }

    if (!user) {
      console.info(
        `[login] Username "${username}" not found in main users table. Searching tenant firm users...`,
      );
      const tenantMatch = await findAnyTenantWorkspaceUserByUsername(username, "admin");

      if (tenantMatch) {
        user = tenantMatch.user;
        tenantOwnerId = tenantMatch.tenantOwnerId;
        tenantWorkspaceUserId = tenantMatch.user.id;

        console.info(
          `[login] Username "${username}" found in tenant DB under client=${tenantOwnerId}, workspaceUser=${tenantWorkspaceUserId}, role="${tenantMatch.user.role}".`,
        );

        const tenantContext = await getTenantContext(tenantOwnerId);
        const firm = await tenantContext.TenantFirm.findOne({
          where: { userId: tenantWorkspaceUserId },
          attributes: ["firmName"],
        });
        tenantFirmName = firm?.firmName || null;
        console.info(
          `[login] Tenant firm lookup for username "${username}" resolved firmName="${tenantFirmName || "N/A"}".`,
        );
      } else {
        console.warn(
          `[login] Username "${username}" not found in any active tenant client workspace.`,
        );
      }
    }

    if (!user)
      return res.status(401).json({ message: "Invalid username or password." });

    if (!isBcryptHash(user.password)) {
      console.warn(
        `[login] Username "${username}" has a non-bcrypt password value in ${
          tenantOwnerId ? `tenant client=${tenantOwnerId}` : "main"
        } DB. Login will fail with bcrypt comparison.`,
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn(
        `[login] Password mismatch for username "${username}" in ${
          tenantOwnerId ? `tenant client=${tenantOwnerId}` : "main"
        } DB.`,
      );
      return res.status(401).json({ message: "Invalid username or password." });
    }

    if (user.role === "client") {
      const today = new Date().toISOString().slice(0, 10);

      if (!user.isActive) {
        console.warn(`[login] Client "${username}" is inactive.`);
        return res.status(403).json({ message: "Client account is deactivated." });
      }

      if (user.expiresAt && user.expiresAt < today) {
        await user.update({ isActive: false });
        console.warn(`[login] Client "${username}" expired on ${user.expiresAt}.`);
        return res.status(403).json({ message: "Client account has expired." });
      }
    }

    // Fetch the firm related to this user (admin)
    let firmName = null;
    if (tenantOwnerId) {
      firmName = tenantFirmName;
    } else if (user.role === "admin" || user.role === "client") {
      const firm = await Firm.findOne({ where: { userId: user.id } });
      if (firm) firmName = firm.firmName;
    }

    const token = jwt.sign(
      {
        id: tenantOwnerId || user.id,
        username: user.username,
        role: user.role,
        workspaceUserId: tenantWorkspaceUserId || null,
        tenantOwnerId: tenantOwnerId || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      role: user.role,
      username: user.username,
      userId: tenantOwnerId || user.id,
      firmName,
      workspaceUserId: tenantWorkspaceUserId,
      tenantOwnerId,
      client: user.role === "client" ? getClientResponse(user) : null,
    });
    console.info(
      `[login] Success for username="${username}" as role="${user.role}" with tenantOwnerId=${tenantOwnerId || "null"} workspaceUserId=${tenantWorkspaceUserId || "null"}.`,
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// get all user (using ID)
export const getAllUser = async (req, res) => {
  const { userId, role: requestedRole } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    if (requestedRole) {
      const loggedInUser = req.user;
      const where = { role: requestedRole };

      if (loggedInUser.role === "superadmin") {
        const users = await User.findAll({
          where,
          attributes: [
            "id",
            "username",
            "role",
            "visiblePassword",
            "createdBy",
            "clientName",
            "contact",
            "email",
            "clientLogo",
            "expiresAt",
            "isActive",
          ],
          order: [["id", "DESC"]],
        });

        return res.status(200).json(users);
      }

      if (loggedInUser.role === "admin") {
        where.createdBy = loggedInUser.id;

        const users = await User.findAll({
          where,
          attributes: [
            "id",
            "username",
            "role",
            "visiblePassword",
            "createdBy",
            "clientName",
            "contact",
            "email",
            "clientLogo",
            "expiresAt",
            "isActive",
          ],
          order: [["id", "DESC"]],
        });

        return res.status(200).json(users);
      }

      return res.status(403).json({ message: "Unauthorized role." });
    }

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
  try {
    const { id, role } = req.user; // 🔐 from JWT only

    // 🔐 superadmin → all users
    if (role === "superadmin") {
      const users = await User.findAll({
        attributes: [
          "id",
          "username",
          "role",
          "visiblePassword",
          "createdBy",
          "clientName",
          "contact",
          "email",
          "clientLogo",
          "expiresAt",
          "isActive",
        ],
      });

      const usersWithConfig = await Promise.all(
        users.map(async (user) => {
          const plainUser = user.toJSON();
          return plainUser;
        }),
      );

      return res.status(200).json(usersWithConfig);
    }

    // 🔐 admin → only users created by him
    const users = await User.findAll({
      where: { createdBy: id },
      attributes: ["id", "username", "role", "visiblePassword", "createdBy"],
    });

    return res.status(200).json(users);
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

export const createClient = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can create a client." });
    }

    const {
      clientName,
      contact,
      email,
      username,
      password,
      expiresAt,
    } = req.body;

    if (!clientName || !contact || !username || !password) {
      return res.status(400).json({
        message: "clientName, contact, username and password are required.",
      });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedDbName = buildClientDatabaseName(clientName);
    const resolvedDbHost = process.env.DB_HOST;
    const resolvedDbPort = process.env.DB_PORT;
    const resolvedDbUser = process.env.DB_USER;
    const resolvedDbPassword = process.env.DB_PASSWORD;

    const createdClient = await createUser(
      username,
      hashedPassword,
      "client",
      password,
      req.user.id,
      {
        clientName,
        contact,
        email: email || null,
        clientLogo: getClientLogoPath(req.file),
        expiresAt: expiresAt || null,
        isActive: true,
      },
    );

    try {
      await createClientDatabase({
        dbName: resolvedDbName,
        dbHost: resolvedDbHost,
        dbPort: resolvedDbPort,
        adminDbName: process.env.DB_DATABASE,
        adminDbUser: process.env.DB_USER,
        adminDbPassword: process.env.DB_PASSWORD,
      });

      await writeClientConfig(createdClient.id, {
        userId: createdClient.id,
        clientName: createdClient.clientName,
        username: createdClient.username,
        dbHost: resolvedDbHost,
        dbPort: resolvedDbPort,
        dbName: resolvedDbName,
        dbUser: resolvedDbUser,
        dbPassword: resolvedDbPassword,
        createdAt: new Date().toISOString(),
      });

      await initializeTenantDatabase(createdClient);
    } catch (configError) {
      await createdClient.destroy();
      throw configError;
    }

    return res.status(201).json({
      message: "Client created successfully.",
      client: getClientResponse(createdClient),
    });
  } catch (error) {
    console.error("Create client error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const updateClientStatus = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can update client status." });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive boolean is required." });
    }

    const client = await User.findByPk(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    if (client.role !== "client") {
      return res.status(400).json({ message: "Status can only be updated for client users." });
    }

    await client.update({ isActive });

    try {
      const tenantContext = await getTenantContext(client.id);
      const tenantUser = await tenantContext.TenantUser.findByPk(client.id);
      if (tenantUser) {
        await tenantUser.update({ isActive });
      }
    } catch (tenantError) {
      console.error("Tenant user status sync warning:", tenantError);
    }

    return res.status(200).json({
      message: isActive ? "Client activated successfully." : "Client deactivated successfully.",
      client: getClientResponse(client),
    });
  } catch (error) {
    console.error("Update client status error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

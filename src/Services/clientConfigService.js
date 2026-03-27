import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";

const clientConfigDir = path.resolve(process.cwd(), "src", "Config", "client-configs");
const legacyConfigFileName = (userId) => `client-${userId}.json`;

const sanitizeClientName = (clientName) =>
  String(clientName || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const ensureClientConfigDir = () => {
  if (!fs.existsSync(clientConfigDir)) {
    fs.mkdirSync(clientConfigDir, { recursive: true });
  }
};

export const buildClientDatabaseName = (clientName, requestedDbName = null) => {
  const baseName = String(requestedDbName || `client_${clientName}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!baseName) {
    throw new Error("Unable to derive a valid database name for client.");
  }

  return baseName;
};

export const getClientConfigPath = (clientName) => {
  ensureClientConfigDir();
  const safeClientName = sanitizeClientName(clientName);

  if (!safeClientName) {
    throw new Error("Valid client name is required to build config file path.");
  }

  return path.join(clientConfigDir, `client_${safeClientName}.json`);
};

export const writeClientConfig = async (userId, config) => {
  const filePath = getClientConfigPath(config?.clientName);
  await fs.promises.writeFile(filePath, JSON.stringify(config, null, 2), "utf8");

  const legacyFilePath = path.join(clientConfigDir, legacyConfigFileName(userId));
  if (legacyFilePath !== filePath && fs.existsSync(legacyFilePath)) {
    await fs.promises.unlink(legacyFilePath);
  }

  return filePath;
};

export const readClientConfig = async (userId) => {
  ensureClientConfigDir();

  const configFiles = await fs.promises.readdir(clientConfigDir);
  for (const fileName of configFiles) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(clientConfigDir, fileName);
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const parsedConfig = JSON.parse(fileContent);

    if (Number(parsedConfig?.userId) === Number(userId)) {
      return parsedConfig;
    }
  }

  const legacyFilePath = path.join(clientConfigDir, legacyConfigFileName(userId));
  if (!fs.existsSync(legacyFilePath)) {
    return null;
  }

  const fileContent = await fs.promises.readFile(legacyFilePath, "utf8");
  return JSON.parse(fileContent);
};

export const createClientDatabase = async ({
  dbName,
  dbHost,
  dbPort,
  adminDbName,
  adminDbUser,
  adminDbPassword,
}) => {
  const adminSequelize = new Sequelize(
    adminDbName,
    adminDbUser,
    adminDbPassword,
    {
      host: dbHost,
      dialect: "postgres",
      port: dbPort,
      logging: false,
    },
  );

  try {
    await adminSequelize.authenticate();
    const [rows] = await adminSequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = :dbName`,
      {
        replacements: { dbName },
      },
    );

    if (!rows.length) {
      await adminSequelize.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await adminSequelize.close();
  }
};

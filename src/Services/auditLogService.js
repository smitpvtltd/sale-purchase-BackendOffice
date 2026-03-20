import AuditLog from "../Models/auditLogModel.js";
import Ledger from "../Models/ledgerModel.js";
import { Sell } from "../Models/sellModel.js";
import { Purchase } from "../Models/purchaseModel.js";

const normalizeModuleName = (moduleName) => {
  if (!moduleName) {
    return null;
  }

  return String(moduleName).trim().toUpperCase();
};

export const logAudit = async ({
  module,
  entityId,
  action,
  oldValue = null,
  newValue = null,
  userId = null,
  metadata = {},
}) => {
  return AuditLog.create({
    module: normalizeModuleName(module),
    entityId: String(entityId),
    action: String(action).toUpperCase(),
    oldValue,
    newValue,
    userId: userId !== undefined && userId !== null ? String(userId) : null,
    metadata,
  });
};

export const safeLogAudit = async (payload) => {
  try {
    return await logAudit(payload);
  } catch (error) {
    console.error("Audit log write failed:", error);
    return null;
  }
};

export const getAuditLogsByModuleEntity = async ({
  module,
  entityId,
  page = 1,
  limit = 20,
}) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.max(1, Number(limit) || 20);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const { rows, count } = await AuditLog.findAndCountAll({
    where: {
      module: normalizeModuleName(module),
      entityId: String(entityId),
    },
    order: [["createdAt", "DESC"]],
    limit: normalizedLimit,
    offset,
  });

  return {
    logs: rows,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total: count,
      totalPages: Math.ceil(count / normalizedLimit) || 1,
    },
  };
};

export const getAuditLogsByLedgerId = async ({
  ledgerId,
  userId,
  page = 1,
  limit = 20,
}) => {
  const ledger = await Ledger.findOne({
    where: {
      id: ledgerId,
      ...(userId ? { userId } : {}),
    },
  });

  if (!ledger) {
    return { ledger: null, logs: [], pagination: null };
  }

  const referenceType =
    ledger.referenceType ||
    (ledger.sourceType ? String(ledger.sourceType).toUpperCase() : null);
  const referenceId =
    ledger.referenceId ||
    (ledger.sourceId !== undefined && ledger.sourceId !== null
      ? String(ledger.sourceId)
      : null);

  if (!referenceType || !referenceId) {
    return {
      ledger,
      logs: [],
      pagination: {
        page: 1,
        limit: Number(limit) || 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const auditLogs = await getAuditLogsByModuleEntity({
    module: referenceType,
    entityId: referenceId,
    page,
    limit,
  });

  return {
    ledger,
    ...auditLogs,
  };
};

export const getAuditLogsByBill = async ({
  type,
  billNo,
  userId,
  page = 1,
  limit = 20,
}) => {
  const normalizedType = String(type || "").trim().toLowerCase();

  if (!["sale", "purchase"].includes(normalizedType)) {
    throw new Error("type must be either sale or purchase.");
  }

  const Model = normalizedType === "sale" ? Sell : Purchase;
  const module = normalizedType === "sale" ? "SALE" : "PURCHASE";

  const entity = await Model.findOne({
    where: {
      invoiceNumber: billNo,
      ...(userId ? { userId } : {}),
    },
  });

  if (!entity) {
    return {
      entity: null,
      logs: [],
      pagination: null,
    };
  }

  const auditLogs = await getAuditLogsByModuleEntity({
    module,
    entityId: entity.id,
    page,
    limit,
  });

  return {
    entity,
    module,
    billNo,
    ...auditLogs,
  };
};

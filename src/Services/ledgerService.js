import Ledger from "../Models/ledgerModel.js";
import Customer from "../Models/customerModel.js";
import PurchaseParty from "../Models/purchasePartyModel.js";
import { Op } from "sequelize";
import { safeLogAudit } from "./auditLogService.js";
import {
  getTenantContext,
  getTenantLedgerModel,
  getTenantPartyModels,
  isClientWorkspaceUser,
} from "./tenantDbService.js";

const getLedgerReference = ({ referenceType, referenceId, sourceType, sourceId, entryType }) => {
  const resolvedReferenceType =
    referenceType ||
    (entryType === "sell"
      ? "SALE"
      : entryType === "purchase"
        ? "PURCHASE"
        : sourceType
          ? String(sourceType).toUpperCase()
          : null);
  const resolvedReferenceId =
    referenceId ||
    (sourceId !== undefined && sourceId !== null ? String(sourceId) : null);

  return {
    referenceType: resolvedReferenceType,
    referenceId: resolvedReferenceId,
  };
};

const ENTRY_TYPE_RULES = {
  sell: "debit",
  purchase: "credit",
  sale_receipt: "credit",
  purchase_receipt: "debit",
  advance_settlement: "none",
  expense: "debit",
};

const ENTRY_TYPE_LABELS = {
  sell: "Sale",
  purchase: "Purchase",
  sale_receipt: "Sale Receipt",
  purchase_receipt: "Purchase Receipt",
  advance_settlement: "Advance Settlement",
  expense: "Expense",
};

export const getEntryTypeLabel = (entryType) =>
  ENTRY_TYPE_LABELS[entryType] || entryType;

export const getLedgerAmounts = (entryType, amount, debitAmount, creditAmount) => {
  const normalizedAmount = Number(amount || 0);

  if (debitAmount !== undefined || creditAmount !== undefined) {
    return {
      amount: normalizedAmount,
      debitAmount: Number(debitAmount || 0),
      creditAmount: Number(creditAmount || 0),
    };
  }

  const rule = ENTRY_TYPE_RULES[entryType] || "none";

  if (rule === "debit") {
    return { amount: normalizedAmount, debitAmount: normalizedAmount, creditAmount: 0 };
  }

  if (rule === "credit") {
    return { amount: normalizedAmount, debitAmount: 0, creditAmount: normalizedAmount };
  }

  return { amount: normalizedAmount, debitAmount: 0, creditAmount: 0 };
};

export const normalizePaymentStatus = ({
  paymentStatus,
  amount = 0,
  balanceAmount = 0,
}) => {
  if (paymentStatus) {
    return paymentStatus;
  }

  const normalizedAmount = Number(amount || 0);
  const normalizedBalance = Number(balanceAmount || 0);

  if (normalizedAmount <= 0) {
    return "Unpaid";
  }

  if (normalizedBalance > 0) {
    return "Partial";
  }

  return "Paid";
};

const attachResolvedPartyNames = async (ledgerRows, models = {}) => {
  if (!Array.isArray(ledgerRows) || ledgerRows.length === 0) {
    return [];
  }

  const customerIds = [
    ...new Set(
      ledgerRows
        .filter(
          (ledger) =>
            !ledger.partyName &&
            ledger.partyType === "customer" &&
            ledger.partyId !== null &&
            ledger.partyId !== undefined,
        )
        .map((ledger) => Number(ledger.partyId)),
    ),
  ];

  const purchasePartyIds = [
    ...new Set(
      ledgerRows
        .filter(
          (ledger) =>
            !ledger.partyName &&
            ledger.partyType === "purchase_party" &&
            ledger.partyId !== null &&
            ledger.partyId !== undefined,
        )
        .map((ledger) => Number(ledger.partyId)),
    ),
  ];

  const CustomerModel = models.CustomerModel || Customer;
  const PurchasePartyModel = models.PurchasePartyModel || PurchaseParty;

  const [customers, purchaseParties] = await Promise.all([
    customerIds.length
      ? CustomerModel.findAll({
          where: { id: customerIds },
          attributes: ["id", "name"],
        })
      : [],
    purchasePartyIds.length
      ? PurchasePartyModel.findAll({
          where: { id: purchasePartyIds },
          attributes: ["id", "name"],
        })
      : [],
  ]);

  const customerNameMap = new Map(
    customers.map((customer) => [Number(customer.id), customer.name]),
  );
  const purchasePartyNameMap = new Map(
    purchaseParties.map((party) => [Number(party.id), party.name]),
  );

  return ledgerRows.map((ledger) => {
    if (ledger.partyName) {
      return ledger;
    }

    if (ledger.partyType === "customer") {
      return {
        ...ledger,
        partyName: customerNameMap.get(Number(ledger.partyId)) || null,
      };
    }

    if (ledger.partyType === "purchase_party") {
      return {
        ...ledger,
        partyName: purchasePartyNameMap.get(Number(ledger.partyId)) || null,
      };
    }

    return ledger;
  });
};

const buildLedgerWhereClause = ({
  userId,
  firmId,
  entryType,
  partyType,
  partyId,
  paymentStatus,
  partyFilters,
}) => {
  const where = { userId };

  if (firmId) {
    where.firmId = firmId;
  }

  if (entryType) {
    where.entryType = entryType;
  }

  if (partyType) {
    where.partyType = partyType;
  }

  if (partyId) {
    where.partyId = partyId;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (Array.isArray(partyFilters) && partyFilters.length > 0) {
    where[Op.or] = partyFilters;
  }

  return where;
};

const resolvePartyFilters = async ({ partyName, models = {} }) => {
  if (!partyName) {
    return [];
  }

  const trimmedPartyName = String(partyName).trim();
  if (!trimmedPartyName) {
    return [];
  }

  const CustomerModel = models.CustomerModel || Customer;
  const PurchasePartyModel = models.PurchasePartyModel || PurchaseParty;

  const [customers, purchaseParties] = await Promise.all([
    CustomerModel.findAll({
      where: {
        name: {
          [Op.iLike]: `%${trimmedPartyName}%`,
        },
      },
      attributes: ["id"],
    }),
    PurchasePartyModel.findAll({
      where: {
        name: {
          [Op.iLike]: `%${trimmedPartyName}%`,
        },
      },
      attributes: ["id"],
    }),
  ]);

  const filters = [];

  if (customers.length > 0) {
    filters.push({
      partyType: "customer",
      partyId: customers.map((customer) => customer.id),
    });
  }

  if (purchaseParties.length > 0) {
    filters.push({
      partyType: "purchase_party",
      partyId: purchaseParties.map((party) => party.id),
    });
  }

  return filters;
};

const normalizeLedgerRows = async (ledgers, models = {}) => {
  const normalizedLedgers = ledgers.map((ledger) => {
    const plainLedger = ledger.toJSON();
    return {
      ...plainLedger,
      entryTypeLabel:
        plainLedger.entryTypeLabel || getEntryTypeLabel(plainLedger.entryType),
    };
  });

  return attachResolvedPartyNames(normalizedLedgers, models);
};

const getBalanceImpact = (ledger) =>
  Number(ledger.creditAmount || 0) - Number(ledger.debitAmount || 0);

const getLedgerDataSource = async (userId) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    const LedgerModel = await getTenantLedgerModel(userId);
    const { TenantCustomer, TenantPurchaseParty } = await getTenantPartyModels(userId);
    return {
      LedgerModel,
      CustomerModel: TenantCustomer,
      PurchasePartyModel: TenantPurchaseParty,
    };
  }

  return {
    LedgerModel: Ledger,
    CustomerModel: Customer,
    PurchasePartyModel: PurchaseParty,
  };
};

export const createLedgerEntry = async ({
  entryDate,
  entryType,
  entryTypeLabel,
  voucherNumber = null,
  sourceType = null,
  sourceId = null,
  firmId = null,
  userId,
  partyType = null,
  partyId = null,
  partyName = null,
  amount = 0,
  debitAmount,
  creditAmount,
  paymentMode = null,
  paymentStatus = null,
  narration = null,
  metadata = {},
  referenceType = null,
  referenceId = null,
  transaction = null,
}) => {
  const amounts = getLedgerAmounts(entryType, amount, debitAmount, creditAmount);
  const { LedgerModel } = await getLedgerDataSource(userId);
  const reference = getLedgerReference({
    referenceType,
    referenceId,
    sourceType,
    sourceId,
    entryType,
  });

  const ledger = await LedgerModel.create(
    {
      entryDate,
      entryType,
      entryTypeLabel: entryTypeLabel || getEntryTypeLabel(entryType),
      voucherNumber,
      sourceType,
      sourceId,
      referenceType: reference.referenceType,
      referenceId: reference.referenceId,
      firmId,
      userId,
      partyType,
      partyId,
      partyName,
      amount: amounts.amount,
      debitAmount: amounts.debitAmount,
      creditAmount: amounts.creditAmount,
      paymentMode,
      paymentStatus,
      narration,
      metadata,
    },
    transaction ? { transaction } : undefined,
  );

  await safeLogAudit({
    module: "LEDGER",
    entityId: ledger.id,
    action: "CREATE",
    oldValue: null,
    newValue: ledger.toJSON(),
    userId,
    metadata: {
      sourceType,
      sourceId,
      referenceType: reference.referenceType,
      referenceId: reference.referenceId,
    },
  });

  return ledger;
};

export const updateLedgerEntryBySource = async ({
  sourceType,
  sourceId,
  entryDate,
  entryType,
  entryTypeLabel,
  voucherNumber = null,
  firmId = null,
  userId,
  partyType = null,
  partyId = null,
  partyName = null,
  amount = 0,
  debitAmount,
  creditAmount,
  paymentMode = null,
  paymentStatus = null,
  narration = null,
  metadata = {},
  referenceType = null,
  referenceId = null,
}) => {
  const { LedgerModel } = await getLedgerDataSource(userId);
  const ledger = await LedgerModel.findOne({
    where: { sourceType, sourceId },
  });

  if (!ledger) {
    return null;
  }

  const amounts = getLedgerAmounts(entryType, amount, debitAmount, creditAmount);
  const reference = getLedgerReference({
    referenceType,
    referenceId,
    sourceType,
    sourceId,
    entryType,
  });
  const oldValue = ledger.toJSON();

  const updatedLedger = await ledger.update({
    entryDate,
    entryType,
    entryTypeLabel: entryTypeLabel || getEntryTypeLabel(entryType),
    voucherNumber,
    referenceType: reference.referenceType,
    referenceId: reference.referenceId,
    firmId,
    userId,
    partyType,
    partyId,
    partyName,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode,
    paymentStatus,
    narration,
    metadata,
  });

  await safeLogAudit({
    module: "LEDGER",
    entityId: updatedLedger.id,
    action: "UPDATE",
    oldValue,
    newValue: updatedLedger.toJSON(),
    userId,
    metadata: {
      sourceType,
      sourceId,
      referenceType: reference.referenceType,
      referenceId: reference.referenceId,
    },
  });

  return updatedLedger;
};

export const upsertLedgerEntryBySource = async ({
  sourceType,
  sourceId,
  entryDate,
  entryType,
  entryTypeLabel,
  voucherNumber = null,
  firmId = null,
  userId,
  partyType = null,
  partyId = null,
  partyName = null,
  amount = 0,
  debitAmount,
  creditAmount,
  paymentMode = null,
  paymentStatus = null,
  narration = null,
  metadata = {},
  referenceType = null,
  referenceId = null,
}) => {
  const updatedLedger = await updateLedgerEntryBySource({
    sourceType,
    sourceId,
    entryDate,
    entryType,
    entryTypeLabel,
    voucherNumber,
    firmId,
    userId,
    partyType,
    partyId,
    partyName,
    amount,
    debitAmount,
    creditAmount,
    paymentMode,
    paymentStatus,
    narration,
    metadata,
    referenceType,
    referenceId,
  });

  if (updatedLedger) {
    return updatedLedger;
  }

  return createLedgerEntry({
    entryDate,
    entryType,
    entryTypeLabel,
    voucherNumber,
    sourceType,
    sourceId,
    firmId,
    userId,
    partyType,
    partyId,
    partyName,
    amount,
    debitAmount,
    creditAmount,
    paymentMode,
    paymentStatus,
    narration,
    metadata,
    referenceType,
    referenceId,
  });
};

export const markLedgerEntryDeletedBySource = async ({
  sourceType,
  sourceId,
  userId = null,
  deletedAt = new Date().toISOString(),
  narration,
}) => {
  const { LedgerModel } = await getLedgerDataSource(userId);
  const ledger = await LedgerModel.findOne({
    where: { sourceType, sourceId },
    order: [["id", "ASC"]],
  });

  if (!ledger) {
    return null;
  }

  const currentMetadata = ledger.metadata || {};
  const oldValue = ledger.toJSON();

  const updatedLedger = await ledger.update({
    paymentStatus: "Deleted",
    narration: narration || ledger.narration,
    metadata: {
      ...currentMetadata,
      isDeleted: true,
      deletedAt,
    },
  });

  await safeLogAudit({
    module: "LEDGER",
    entityId: updatedLedger.id,
    action: "DELETE",
    oldValue,
    newValue: updatedLedger.toJSON(),
    userId: updatedLedger.userId,
    metadata: {
      sourceType,
      sourceId,
      softDeleted: true,
    },
  });

  return updatedLedger;
};

export const getAllLedgerEntries = async ({
  userId,
  firmId,
  entryType,
  partyType,
  partyId,
  partyName,
  paymentStatus,
  dateFrom,
  dateTo,
}) => {
  const dataSource = await getLedgerDataSource(userId);
  const { LedgerModel, CustomerModel, PurchasePartyModel } = dataSource;
  const partyFilters = await resolvePartyFilters({
    partyName,
    models: { CustomerModel, PurchasePartyModel },
  });

  if (partyName && partyFilters.length === 0) {
    return {
      openingBalance: 0,
      closingBalance: 0,
      entries: [],
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    };
  }

  const where = buildLedgerWhereClause({
    userId,
    firmId,
    entryType,
    partyType,
    partyId,
    paymentStatus,
    partyFilters,
  });

  const rangeWhere = { ...where };

  if (dateFrom || dateTo) {
    rangeWhere.entryDate = {};

    if (dateFrom) {
      rangeWhere.entryDate[Op.gte] = dateFrom;
    }

    if (dateTo) {
      rangeWhere.entryDate[Op.lte] = dateTo;
    }
  }

  let openingBalance = 0;

  if (dateFrom) {
    const openingEntries = await LedgerModel.findAll({
      where: {
        ...where,
        entryDate: {
          [Op.lt]: dateFrom,
        },
      },
      order: [
        ["entryDate", "ASC"],
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    openingBalance = openingEntries.reduce(
      (sum, ledger) => sum + getBalanceImpact(ledger),
      0,
    );
  }

  const ledgers = await LedgerModel.findAll({
    where: rangeWhere,
    order: [
      ["entryDate", "ASC"],
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
  });

  const resolvedLedgers = await normalizeLedgerRows(ledgers, {
    CustomerModel,
    PurchasePartyModel,
  });

  let runningBalance = openingBalance;
  const entries = resolvedLedgers.map((ledger) => {
    runningBalance += getBalanceImpact(ledger);

    return {
      ...ledger,
      rowBalance: runningBalance,
    };
  }).reverse();

  return {
    openingBalance,
    closingBalance: runningBalance,
    entries,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  };
};

export const getLedgerEntryById = async (id, userId) => {
  const { LedgerModel, CustomerModel, PurchasePartyModel } = await getLedgerDataSource(userId);
  const ledger = await LedgerModel.findOne({
    where: { id, userId },
  });

  if (!ledger) {
    return null;
  }

  const plainLedger = ledger.toJSON();
  const normalizedLedger = {
    ...plainLedger,
    entryTypeLabel: plainLedger.entryTypeLabel || getEntryTypeLabel(plainLedger.entryType),
  };

  const [resolvedLedger] = await attachResolvedPartyNames([normalizedLedger], {
    CustomerModel,
    PurchasePartyModel,
  });
  return resolvedLedger;
};

export const getLedgerEntriesByParty = async ({
  userId,
  partyId,
  partyType = null,
  firmId,
  entryType,
  partyName,
  paymentStatus,
  dateFrom,
  dateTo,
}) => {
  return getAllLedgerEntries({
    userId,
    firmId,
    entryType,
    partyType,
    partyId,
    partyName,
    paymentStatus,
    dateFrom,
    dateTo,
  });
};

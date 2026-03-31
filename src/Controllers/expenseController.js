import Expense from "../Models/expenseModel.js";
import User from "../Models/userModel.js";
import {
  createExpense,
  getExpensesByUser,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../Services/expenseService.js";
import {
  createLedgerEntry,
  markLedgerEntryDeletedBySource,
  updateLedgerEntryBySource,
} from "../Services/ledgerService.js";
import { safeLogAudit } from "../Services/auditLogService.js";
import {
  createTenantExpense,
  deleteTenantExpense,
  getTenantExpenseById,
  getTenantExpenses,
  isClientWorkspaceUser,
  updateTenantExpense,
} from "../Services/tenantDbService.js";
import { resolveTenantRequestContext } from "../Services/tenantDbService.js";

const getExpenseAuditSnapshot = (expense) => ({
  id: expense.id,
  date: expense.date,
  firmId: expense.firmId,
  userId: expense.userId,
  toWhom: expense.toWhom,
  reason: expense.reason,
  expenseType: expense.expenseType,
  amount: expense.amount,
  description: expense.description,
});

// Add a new expense
export const addExpense = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);

    const {
      date,
      firmId,
      userId,
      toWhom,
      reason,
      expenseType,
      amount,
      description,
    } = req.body;

    if (
      !date ||
      !firmId ||
      !userId ||
      !toWhom ||
      !reason ||
      (expenseType !== 0 && expenseType !== 1) ||
      !amount
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const expenseData = {
      userId,
      firmId,
      date,
      toWhom,
      reason,
      expenseType,
      amount,
      description,
    };

    let expense;

    // ✅ SAME AS SELL FLOW
    if (tenantOwnerId && (await isClientWorkspaceUser(tenantOwnerId))) {
      expense = await createTenantExpense(tenantOwnerId, expenseData);
    } else {
      expense = await createExpense(expenseData);
    }

    // ✅ Ledger (optional: convert to upsert like sell)
    await createLedgerEntry({
      entryDate: expense.date,
      entryType: "expense",
      sourceType: "expense",
      sourceId: expense.id,
      firmId: expense.firmId,
      userId: expense.userId,
      partyType: "other",
      partyName: expense.toWhom,
      amount: expense.amount,
      paymentStatus: "Paid",
      narration: expense.reason,
      metadata: {
        expenseType: expense.expenseType,
        description: expense.description,
      },
    });

    res.status(201).json({ message: "Expense added successfully.", expense });

    await safeLogAudit({
      module: "EXPENSE",
      entityId: expense.id,
      action: "CREATE",
      oldValue: null,
      newValue: getExpenseAuditSnapshot(expense),
      userId: expense.userId,
      metadata: { firmId: expense.firmId },
    });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// Get all expenses for a user
export const getExpenses = async (req, res) => {
  try {

    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const { firmId } = req.query;

    if (!firmId) {
      return res.status(400).json({ message: "firmId is required." });
    }

    let expenses;

    if (tenantOwnerId && (await isClientWorkspaceUser(tenantOwnerId))) {
      expenses = await getTenantExpenses(tenantOwnerId, firmId);
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get Expenses Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get a single expense by ID
export const getSingleExpense = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const { id } = req.params;
    const expense =
      tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)
        ? await getTenantExpenseById(tenantOwnerId, id)
        : await getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.status(200).json(expense);
  } catch (error) {
    console.error("Get Single Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Edit an existing expense
export const editExpense = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const { id } = req.params;

    if (!req.body.firmId) {
      return res.status(400).json({ message: "firmId is required." });
    }

    const expense =
      await isClientWorkspaceUser(tenantOwnerId)
        ? await getTenantExpenseById(tenantOwnerId, id)
        : await getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const previousExpense = expense.toJSON();

    if (
      expense.userId !== tenantOwnerId 
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (await isClientWorkspaceUser(tenantOwnerId)) {
      await updateTenantExpense(tenantOwnerId, id, req.body);
    } else {
      await expense.update(req.body);
    }

    await updateLedgerEntryBySource({
      sourceType: "expense",
      sourceId: expense.id,
      entryDate: expense.date,
      entryType: "expense",
      firmId: expense.firmId,
      userId: expense.userId,
      partyType: "other",
      partyName: expense.toWhom,
      amount: expense.amount,
      paymentStatus: "Paid",
      narration: expense.reason,
      metadata: {
        expenseType: expense.expenseType,
        description: expense.description,
      },
    });

    res.status(200).json({ message: "Expense updated.", expense });

    await safeLogAudit({
      module: "EXPENSE",
      entityId: expense.id,
      action: "UPDATE",
      oldValue: getExpenseAuditSnapshot(previousExpense),
      newValue: getExpenseAuditSnapshot(expense),
      userId: expense.userId,
      metadata: { firmId: expense.firmId },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

// Delete an expense
export const removeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted =
      await isClientWorkspaceUser(req.user.id)
        ? await deleteTenantExpense(req.user.id, id)
        : await deleteExpense(id);
    if (!deleted) {
      return res.status(404).json({ message: "Expense not found." });
    }

    await markLedgerEntryDeletedBySource({
      sourceType: "expense",
      sourceId: deleted.id,
      userId: deleted.userId,
      narration: `Expense deleted: ${deleted.reason}`,
    });

    res.status(200).json({ message: "Expense deleted.", expense: deleted });

    await safeLogAudit({
      module: "EXPENSE",
      entityId: deleted.id,
      action: "DELETE",
      oldValue: getExpenseAuditSnapshot(deleted),
      newValue: null,
      userId: deleted.userId,
      metadata: { firmId: deleted.firmId },
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
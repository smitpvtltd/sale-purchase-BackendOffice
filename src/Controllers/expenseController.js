import Expense from "../Models/expenseModel.js";
import User from "../Models/userModel.js";
import {
  createExpense,
  getExpensesByUser,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../Services/expenseService.js";

// Add a new expense
export const addExpense = async (req, res) => {
  try {
    const { date, toWhom, reason, expenseType, amount, description } = req.body;
    const loggedInUser = req.user; // from JWT

    if (
      !date ||
      !toWhom ||
      !reason ||
      (expenseType !== 0 && expenseType !== 1) ||
      !amount
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const expense = await createExpense({
      userId: loggedInUser.id, // ✅ SECURE
      date,
      toWhom,
      reason,
      expenseType,
      amount,
      description,
    });

    res.status(201).json({ message: "Expense added successfully.", expense });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get all expenses for a user
export const getExpenses = async (req, res) => {
  try {
    const { id, role } = req.user;

    let expenses;

    if (role === "superadmin") {
      expenses = await Expense.findAll({
        order: [["date", "DESC"]],
      });
    } 
    else if (role === "admin") {
      // users created by admin
      const users = await User.findAll({
        where: { createdBy: id },
        attributes: ["id"],
      });

      const allowedUserIds = [id, ...users.map(u => u.id)];

      expenses = await Expense.findAll({
        where: { userId: allowedUserIds },
        order: [["date", "DESC"]],
      });
    } 
    else {
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
    const { id } = req.params;
    const expense = await getExpenseById(id);
    if (!expense)
      return res.status(404).json({ message: "Expense not found." });
    res.status(200).json(expense);
  } catch (error) {
    console.error("Get Single Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Edit an existing expense
export const editExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    const expense = await getExpenseById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    if (expense.userId !== loggedInUser.id && loggedInUser.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await expense.update(req.body);
    res.status(200).json({ message: "Expense updated.", expense });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};


// Delete an expense
export const removeExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteExpense(id);
    if (!deleted)
      return res.status(404).json({ message: "Expense not found." });
    res.status(200).json({ message: "Expense deleted.", expense: deleted });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

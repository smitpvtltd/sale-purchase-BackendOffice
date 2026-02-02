import express from "express";
import {
  addExpense,
  getExpenses,
  getSingleExpense,
  editExpense,
  removeExpense
} from "../Controllers/expenseController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, addExpense); // Add a new expense
router.get("/all", authenticateToken, getExpenses); // Get all expenses by user
router.get("/:id", authenticateToken, getSingleExpense); // Get a single expense by ID
router.put("/edit/:id", authenticateToken, editExpense); // Edit an existing expense
router.delete("/delete/:id", authenticateToken, removeExpense); // Delete an expense

export default router;

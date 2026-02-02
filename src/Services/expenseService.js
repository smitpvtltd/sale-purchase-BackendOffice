import Expense from '../Models/expenseModel.js';
// import Reason from "../Models/reasonModel.js";


// Create a new expense
export const createExpense = async (expenseData) => {
  return await Expense.create(expenseData);
};

// Get all expenses for a specific user
export const getExpensesByUser = async (userId) => {
  return await Expense.findAll({
    where: { userId },
    order: [["date", "DESC"]],
  });
};

// Get expense by ID
export const getExpenseById = async (id) => {
  return await Expense.findByPk(id);
};

// Update an existing expense
export const updateExpense = async (id, updateData) => {
  const expense = await getExpenseById(id);
  if (!expense) return null;

  await expense.update(updateData);
  return expense;
};

// Delete an expense
export const deleteExpense = async (id) => {
  const expense = await getExpenseById(id);
  if (!expense) return null;

  await expense.destroy();
  return expense;
};

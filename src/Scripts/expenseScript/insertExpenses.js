import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import sequelize from "../../Config/db.js";
import Expense from "../../Models/expenseModel.js";

// ✅ Import JSON data directly
import expenses from "./combinedExpenses.json" with { type: "json" };

// Get correct file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function insertExpenses() {
  try {
    console.log("🔄 Starting bulk expense insert...");

    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    if (!Array.isArray(expenses)) {
      throw new Error("JSON file does not contain an array of expenses!");
    }

    // Map and prepare data for insertion
    const formattedExpenses = expenses.map(exp => ({
      userId: 2,
      date: exp.exp_dt,
      toWhom: exp.to_whom,
      reason: exp.reason,
      expenseType: exp.expense_type,
      amount: parseFloat(exp.expense_amt),
      description: exp.description || "",
    }));

    // Bulk insert into DB
    await Expense.bulkCreate(formattedExpenses);
    console.log(`✅ Successfully inserted ${formattedExpenses.length} expenses!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting expenses:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

insertExpenses();

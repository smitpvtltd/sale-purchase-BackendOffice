import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get correct paths when using ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your JSON files
import expenses from "./expenses.json" with { type: "json" };
import reasons from "./reason.json" with { type: "json" };

async function combine() {
  try {
    console.log("🔄 Combining expenses with reasons...");

    // Create a map: reason_id → reason name
    const reasonMap = {};
    for (const r of reasons) {
      reasonMap[r.id] = r.reason;
    }

    // Combine each expense with its reason name
    const combined = expenses.map(exp => {
      return {
        exp_dt: exp.exp_dt,
        to_whom: exp.to_whom,
        reason: reasonMap[exp.reason_id] || "Unknown",
        expense_type: exp.expense_type,
        expense_amt: exp.expense_amt,
        description: exp.description
      };
    });

    // Save combined data into a new JSON file
    const outputPath = path.join(__dirname, "combinedExpenses.json");
    fs.writeFileSync(outputPath, JSON.stringify(combined, null, 2));

    console.log("✅ Combined file created successfully at:", outputPath);
    console.log(JSON.stringify(combined, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error combining files:", err);
    process.exit(1);
  }
}

combine();

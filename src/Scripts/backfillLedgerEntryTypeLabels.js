import sequelize from "../Config/db.js";
import Ledger from "../Models/ledgerModel.js";
import { getEntryTypeLabel } from "../Services/ledgerService.js";

const backfillLedgerEntryTypeLabels = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    const ledgers = await Ledger.findAll({
      where: {
        entryTypeLabel: null,
      },
    });

    if (ledgers.length === 0) {
      console.log("No ledger rows need backfill.");
      return;
    }

    for (const ledger of ledgers) {
      ledger.entryTypeLabel = getEntryTypeLabel(ledger.entryType);
      await ledger.save();
    }

    console.log(`Backfilled ${ledgers.length} ledger rows.`);
  } catch (error) {
    console.error("Error backfilling ledger entryTypeLabel:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

backfillLedgerEntryTypeLabels();

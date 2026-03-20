import Product from "../Models/productModel.js";
import { Return, ReturnItem } from "../Models/returnModel.js";
import Ledger from "../Models/ledgerModel.js";
import { decreaseStock, increaseStock } from "../Middleware/stockService.js";

// ➕ Add Return
export const addReturn = async (returnData, items) => {
  const transaction = await Return.sequelize.transaction();

  try {
    const returnBillNo = `RET-${returnData.invoiceNumber}`;
    const record = await Return.create({ ...returnData, returnBillNo }, { transaction });

    if (items?.length > 0) {
      for (const item of items) {
        // ✅ Use centralized function
        await increaseStock(item.productId, item.quantity, transaction);

        await ReturnItem.create(
          { ...item, returnId: record.id, userId: returnData.userId },
          { transaction }
        );
      }
    }

    await transaction.commit();
    return await Return.findByPk(record.id, {
      include: { model: ReturnItem, as: "items" },
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// 🧾 Get all Returns
export const getAllReturns = async (userId) => {
  return await Return.findAll({
    where: { userId },
    include: { model: ReturnItem, as: "items" },
    order: [["id", "DESC"]],
  });
};

// 🔍 Find Return by invoice
export const findReturnByInvoice = async (invoiceNumber, userId) => {
  return await Return.findOne({
    where: { invoiceNumber, userId },
    include: { model: ReturnItem, as: "items" },
  });
};

// 🗑️ Delete Return
export const deleteReturn = async (id) => {
  const transaction = await Return.sequelize.transaction();

  try {
    // Load the parent row with items so stock and ledger can be reversed atomically.
    const record = await Return.findByPk(id, {
      include: [{ model: ReturnItem, as: "items" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      await transaction.rollback();
      return null;
    }

    // Reverse the stock increase that happened when the return was created.
    for (const item of record.items || []) {
      await decreaseStock(item.productId, item.quantity, transaction);
    }

    // Remove ledger rows linked to this return before deleting the source record.
    await Ledger.destroy({
      where: {
        sourceType: "return",
        sourceId: id,
      },
      transaction,
    });

    await ReturnItem.destroy({
      where: { returnId: id },
      transaction,
    });

    await record.destroy({ transaction });

    await transaction.commit();
    return record;
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting return with full reversal:", err);
    throw err;
  }
};

import Product from "../Models/productModel.js";
import { Exchange, ExchangeReturnItem, ExchangeGivenItem } from "../Models/exchangeModel.js";
import Ledger from "../Models/ledgerModel.js";
import { increaseStock, decreaseStock } from "../Middleware/stockService.js";


// ➕ Add Exchange
export const addExchange = async (exchangeData, returnedItems = [], givenItems = []) => {
  const transaction = await Exchange.sequelize.transaction();

  try {
    const exchangeBillNo = `EXC-${exchangeData.invoiceNumber}`;

    // Auto-calculate total value of returned items
    const returnTotal = returnedItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    // Create exchange record
    const record = await Exchange.create(
      { ...exchangeData, exchangeBillNo, returnTotal },
      { transaction }
    );

    /**
     * 🟢 Handle returned items — stock increases
     */
    for (const item of returnedItems) {
      await increaseStock(item.productId, item.quantity, transaction);

      await ExchangeReturnItem.create(
        {
          ...item,
          exchangeId: record.id,
          userId: exchangeData.userId,
        },
        { transaction }
      );
    }

    /**
     * 🔴 Handle given items — stock decreases
     */
    for (const item of givenItems) {
      await decreaseStock(item.productId, item.quantity, transaction);

      await ExchangeGivenItem.create(
        {
          ...item,
          exchangeId: record.id,
          userId: exchangeData.userId,
          discountType: item.discountType || "₹",
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Fetch final exchange record with details
    return await Exchange.findByPk(record.id, {
      include: [
        { model: ExchangeReturnItem, as: "returnedItems" },
        { model: ExchangeGivenItem, as: "givenItems" },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// 🧾 Get all Exchanges
export const getAllExchanges = async (userId) => {
  return await Exchange.findAll({
    where: { userId },
    include: [
      { model: ExchangeReturnItem, as: "returnedItems" },
      { model: ExchangeGivenItem, as: "givenItems" },
    ],
    order: [["id", "DESC"]],
  });
};

// 🔍 Find Exchange by invoice
export const findExchangeByInvoice = async (invoiceNumber, userId) => {
  return await Exchange.findOne({
    where: { invoiceNumber, userId },
    include: [
      { model: ExchangeReturnItem, as: "returnedItems" },
      { model: ExchangeGivenItem, as: "givenItems" },
    ],
  });
};

// 🗑️ Delete Exchange
export const deleteExchange = async (id) => {
  const transaction = await Exchange.sequelize.transaction();

  try {
    // Load the full exchange with both item collections so we can reverse
    // stock and ledger side effects in one atomic transaction.
    const record = await Exchange.findByPk(id, {
      include: [
        { model: ExchangeReturnItem, as: "returnedItems" },
        { model: ExchangeGivenItem, as: "givenItems" },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      await transaction.rollback();
      return null;
    }

    // Reverse stock for returned items that were previously added.
    for (const item of record.returnedItems || []) {
      await decreaseStock(item.productId, item.quantity, transaction);
    }

    // Reverse stock for given items that were previously deducted.
    for (const item of record.givenItems || []) {
      await increaseStock(item.productId, item.quantity, transaction);
    }

    // Delete ledger rows tied to this exchange before removing the source record.
    await Ledger.destroy({
      where: {
        sourceType: "exchange",
        sourceId: id,
      },
      transaction,
    });

    await ExchangeReturnItem.destroy({
      where: { exchangeId: id },
      transaction,
    });

    await ExchangeGivenItem.destroy({
      where: { exchangeId: id },
      transaction,
    });

    await record.destroy({ transaction });

    await transaction.commit();
    return record;
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting exchange with full reversal:", err);
    throw err;
  }
};

// 🗑️ Delete Exchange with stock adjustments
// export const deleteExchange = async (id) => {
//   const transaction = await Exchange.sequelize.transaction();
//   try {
//     const record = await Exchange.findByPk(id, {
//       include: [
//         { model: ExchangeReturnItem, as: "returnedItems" },
//         { model: ExchangeGivenItem, as: "givenItems" },
//       ],
//     });

//     if (!record) return null;

//     // 🟢 Returned items were added earlier — now remove them
//     for (const item of record.returnedItems) {
//       await decreaseStock(item.productId, item.quantity, transaction);
//     }

//     // 🔴 Given items were removed earlier — now restore them
//     for (const item of record.givenItems) {
//       await increaseStock(item.productId, item.quantity, transaction);
//     }

//     // Delete records
//     await ExchangeReturnItem.destroy({ where: { exchangeId: id }, transaction });
//     await ExchangeGivenItem.destroy({ where: { exchangeId: id }, transaction });
//     await record.destroy({ transaction });

//     await transaction.commit();
//     return record;
//   } catch (err) {
//     await transaction.rollback();
//     throw err;
//   }
// };

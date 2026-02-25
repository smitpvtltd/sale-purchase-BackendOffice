import {
  decreaseStock,
  increaseStock,
  restoreStockAfterSellUpdate,
} from "../Middleware/stockService.js";
import { Sell, SellItem } from "../Models/sellModel.js";
import { Op } from "sequelize";
import sequelize from "../Config/db.js";

// Add Sell + Items
export const addSell = async (sellData, items) => {
  const t = await sequelize.transaction();
  try {
    const sell = await Sell.create(sellData, { transaction: t });

    if (items && items.length > 0) {
      const safeItems = items.map((item) => ({
        ...item,
        sellId: sell.id,
        userId: sellData.userId,
        offerPrice: item.offerPrice ?? item.price, // fallback if missing
        discount: item.discount ?? 0,
        discountType: item.discountType ?? "₹",
        // ✅ PRODUCT GST SAFE
        gstRate: item.gstRate ?? 0,
        gstAmount: item.gstAmount ?? 0,
        totalPrice:
          item.totalPrice ??
          (item.offerPrice ?? item.price) * item.quantity +
            (item.gstAmount ?? 0),
      }));

      for (const item of safeItems) {
        await decreaseStock(item.productId, item.quantity);
        await SellItem.create(item, { transaction: t });
      }
    }

    await t.commit();

    return await Sell.findByPk(sell.id, {
      include: { model: SellItem, as: "items" },
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// Get all sells by user
export const getAllSells = async (userId) => {
  return await Sell.findAll({
    where: { userId },
    include: { model: SellItem, as: "items" }, // ✅ use alias
    order: [["id", "DESC"]],
  });
};

// Find by Invoice
export const findSellByInvoice = async (invoiceNumber, userId) => {
  return await Sell.findOne({
    where: { invoiceNumber, userId },
    include: { model: SellItem, as: "items" }, // ✅ use alias
  });
};

// Update Sell + Items
// export const updateSell = async (id, sellData, items) => {
//   const sell = await Sell.findByPk(id);
//   if (!sell) return null;

//   const previousItems = await SellItem.findAll({ where: { sellId: id } });

//   // Restore stock for previously sold items
//   await restoreStockAfterSellUpdate(previousItems);

//   await sell.update(sellData);

//   if (items) {
//     await SellItem.destroy({ where: { sellId: id } });

//     for (const item of items) {
//       await decreaseStock(item.productId, item.quantity);
//       await SellItem.create({
//         ...item,
//         sellId: id,
//         userId: sellData.userId,
//       });
//     }
//   }

//   return await Sell.findByPk(id, {
//     include: { model: SellItem, as: "items" },
//   });
// };
export const updateSell = async (id, sellData, items) => {
  const sell = await Sell.findByPk(id);
  if (!sell) return null;

  const previousItems = await SellItem.findAll({ where: { sellId: id } });
  await restoreStockAfterSellUpdate(previousItems);

  await sell.update(sellData);

  if (items) {
    await SellItem.destroy({ where: { sellId: id } });

    const safeItems = items.map((item) => ({
      ...item,
      sellId: id,
      userId: sellData.userId,
      offerPrice: item.offerPrice ?? item.price,
      discount: item.discount ?? 0,
      discountType: item.discountType ?? "₹",
      //product GST
      gstRate: item.gstRate ?? 0,
      gstAmount: item.gstAmount ?? 0,
      totalPrice:
        item.totalPrice ??
        (item.offerPrice ?? item.price) * item.quantity + (item.gstAmount ?? 0),
    }));

    for (const item of safeItems) {
      await decreaseStock(item.productId, item.quantity);
      await SellItem.create(item);
    }
  }

  return await Sell.findByPk(id, {
    include: { model: SellItem, as: "items" },
  });
};

// Delete Sell + Items
export const deleteSell = async (id) => {
  const sell = await Sell.findByPk(id);
  if (!sell) return null;

  const sellItems = await SellItem.findAll({ where: { sellId: id } });
  await restoreStockAfterSellUpdate(sellItems);

  await SellItem.destroy({ where: { sellId: id } });
  await sell.destroy();

  return sell;
};

// Generate next invoice number
export const generateNextInvoiceNumber = async (prefix, userId) => {
  const latestInvoice = await Sell.findOne({
    where: {
      invoiceNumber: { [Op.like]: `${prefix}%` },
      userId,
    },
    order: [["id", "DESC"]],
  });

  if (!latestInvoice) return `${prefix}-001`; // Ensures the starting format is INV-001

  const match = latestInvoice.invoiceNumber.match(/\d+$/);
  const lastNumber = match ? parseInt(match[0], 10) : 0;
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0"); // Ensures 3 digits

  return `${prefix}-${nextNumber}`; // Result like INV-001, INV-002, ...
};

// ================= Get Sell by ID =================
export const getSellById = async (id) => {
  const sell = await Sell.findByPk(id, {
    include: { model: SellItem, as: "items" },
  });
  return sell; // can be null if not found
};

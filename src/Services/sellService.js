import { decreaseStock, increaseStock } from "../Middleware/stockService.js";
import { Sell, SellItem } from "../Models/sellModel.js";
import Receipt from "../Models/receiptModel.js";
import { Op } from "sequelize";
import sequelize from "../Config/db.js";

const getSellItemKey = (item) => `${item.productId}::${item.size ?? ""}`;

const toSafeSellItem = (item, sellId, userId) => ({
  ...item,
  sellId,
  userId,
  offerPrice: item.offerPrice ?? item.price,
  discount: item.discount ?? 0,
  discountType: item.discountType ?? "â‚¹",
  gstRate: item.gstRate ?? 0,
  gstAmount: item.gstAmount ?? 0,
  totalPrice:
    item.totalPrice ??
    (item.offerPrice ?? item.price) * item.quantity + (item.gstAmount ?? 0),
});

// Add Sell + Items
export const addSell = async (sellData, items) => {
  const t = await sequelize.transaction();
  try {
    const sell = await Sell.create(sellData, { transaction: t });

    if (items && items.length > 0) {
      const safeItems = items.map((item) =>
        toSafeSellItem(item, sell.id, sellData.userId),
      );

      for (const item of safeItems) {
        await decreaseStock(item.productId, item.quantity, t);
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
export const getAllSells = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.firmId) {
    where.firmId = filters.firmId;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.pendingOnly) {
    where.balanceAmount = { [Op.gt]: 0 };
  }

  return await Sell.findAll({
    where,
    include: { model: SellItem, as: "items" },
    order: [["id", "DESC"]],
  });
};

// Find by Invoice
export const findSellByInvoice = async (invoiceNumber, userId) => {
  return await Sell.findOne({
    where: { invoiceNumber, userId },
    include: { model: SellItem, as: "items" },
  });
};

// Update Sell + Items using differential stock changes
export const updateSell = async (id, sellData, items) => {
  return await sequelize.transaction(async (t) => {
    const sell = await Sell.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!sell) return null;

    if (Array.isArray(items)) {
      const existingItems = await SellItem.findAll({
        where: { sellId: id },
        transaction: t,
      });
      const nextItems = items;
      const seenKeys = new Set();

      for (const item of nextItems) {
        const key = getSellItemKey(item);
        if (seenKeys.has(key)) {
          throw new Error(
            `Duplicate sell item found for product ${item.productId}${item.size ? ` and size ${item.size}` : ""}`,
          );
        }
        seenKeys.add(key);
      }

      const previousItemsByKey = new Map(
        existingItems.map((item) => [getSellItemKey(item), item]),
      );
      const nextItemsByKey = new Map(
        nextItems.map((item) => [getSellItemKey(item), item]),
      );

      const removedItems = existingItems.filter(
        (item) => !nextItemsByKey.has(getSellItemKey(item)),
      );
      const addedItems = nextItems.filter(
        (item) => !previousItemsByKey.has(getSellItemKey(item)),
      );
      const sharedItems = nextItems.filter((item) =>
        previousItemsByKey.has(getSellItemKey(item)),
      );

      // Removed products: restore stock and delete their rows.
      for (const removedItem of removedItems) {
        await increaseStock(removedItem.productId, removedItem.quantity, t);
        await SellItem.destroy({
          where: { id: removedItem.id },
          transaction: t,
        });
      }

      // Updated products: adjust only the quantity delta and refresh row values.
      for (const incomingItem of sharedItems) {
        const existingItem = previousItemsByKey.get(getSellItemKey(incomingItem));
        const safeItem = toSafeSellItem(
          incomingItem,
          id,
          sellData.userId ?? sell.userId,
        );
        const quantityDiff =
          Number(safeItem.quantity || 0) - Number(existingItem.quantity || 0);

        if (quantityDiff > 0) {
          await decreaseStock(existingItem.productId, quantityDiff, t);
        } else if (quantityDiff < 0) {
          await increaseStock(existingItem.productId, Math.abs(quantityDiff), t);
        }

        await existingItem.update(safeItem, { transaction: t });
      }

      // Added products: deduct stock and create rows.
      for (const addedItem of addedItems) {
        const safeItem = toSafeSellItem(
          addedItem,
          id,
          sellData.userId ?? sell.userId,
        );
        await decreaseStock(safeItem.productId, safeItem.quantity, t);
        await SellItem.create(safeItem, { transaction: t });
      }
    }

    await sell.update(sellData, { transaction: t });

    return await Sell.findByPk(id, {
      include: { model: SellItem, as: "items" },
      transaction: t,
    });
  });
};

// Delete Sell + Items
export const deleteSell = async (id) => {
  return await sequelize.transaction(async (t) => {
    const sell = await Sell.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sell) return null;

    const items = await SellItem.findAll({
      where: { sellId: id },
      transaction: t,
    });

    for (const item of items) {
      await increaseStock(item.productId, item.quantity, t);
    }

    await SellItem.destroy({ where: { sellId: id }, transaction: t });
    await sell.destroy({ transaction: t });

    return sell;
  });
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

  if (!latestInvoice) return `${prefix}-001`;

  const match = latestInvoice.invoiceNumber.match(/\d+$/);
  const lastNumber = match ? parseInt(match[0], 10) : 0;
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

  return `${prefix}-${nextNumber}`;
};

// ================= Get Sell by ID =================
export const getSellById = async (id) => {
  const sell = await Sell.findByPk(id, {
    include: { model: SellItem, as: "items" },
  });
  if (!sell) return null;

  const receipts = await Receipt.findAll({
    where: { billNumber: sell.id },
    order: [["date", "DESC"], ["createdAt", "DESC"], ["id", "DESC"]],
  });

  sell.setDataValue("receipts", receipts);
  return sell;
};

import sequelize from "../Config/db.js";
import Stock from "../Models/stockModel.js";
import StockItem from "../Models/stockItemModel.js";
import Product from "../Models/productModel.js";
import { increaseStock, decreaseStock } from "../Middleware/stockService.js";

// Helper to generate the next ref number
const generateNextRefNumber = async (transaction) => {
  // Find the latest stock entry (sorted by id DESC)
  const lastStock = await Stock.findOne({
    order: [["id", "DESC"]],
    transaction,
  });

  // Extract numeric part from refNumber (like STK-000001 -> 1)
  let nextNumber = 1;
  if (lastStock && lastStock.refNumber) {
    const match = lastStock.refNumber.match(/STK-(\d+)/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }

  // Format as STK-000001
  const formatted = `STK-${String(nextNumber).padStart(4, "0")}`;
  return formatted;
};

// Create stock (add quantities)
export const createStockService = async (data) => {
  const { items, userId, ...stockData } = data;

  return await sequelize.transaction(async (t) => {
    // ✅ Generate refNumber automatically
    const refNumber = await generateNextRefNumber(t);

    // Create stock with auto refNumber
    const stock = await Stock.create(
      { ...stockData, userId, refNumber },
      { transaction: t },
    );

    const stockItems = items.map((item) => ({
      stockId: stock.id,
      productId: Number(item.productId),

      previousStockQty: Math.round(Number(item.previousStockQty || 0)),
      quantity: Math.round(Number(item.quantity || 0)),

      totalPrice: Number(item.totalPrice || 0),
    }));

    await StockItem.bulkCreate(stockItems, { transaction: t });

    // Increase product stock
    for (const item of items) {
      await increaseStock(item.productId, item.quantity, t);
    }

    return stock;
  });
};

// Update stock (adjust quantities)
export const updateStockService = async (id, data) => {
  const { items, ...stockData } = data;

  return await sequelize.transaction(async (t) => {
    const stock = await Stock.findByPk(id, { transaction: t });
    if (!stock) throw new Error("Stock not found");

    const oldItems = await StockItem.findAll({
      where: { stockId: id },
      transaction: t,
    });

    // Decrease quantities for old items
    for (const old of oldItems) {
      await decreaseStock(old.productId, old.quantity, t);
    }

    // Delete old items and update stock info
    await StockItem.destroy({ where: { stockId: id }, transaction: t });
    await stock.update(stockData, { transaction: t });

    // Add new items
    const newItems = items.map((item) => ({
      ...item,
      stockId: id,
    }));

    await StockItem.bulkCreate(newItems, { transaction: t });

    // Increase stock for new items
    for (const item of items) {
      await increaseStock(item.productId, item.quantity, t);
    }

    return stock;
  });
};

// Delete stock (reduce quantities)
export const deleteStockService = async (id) => {
  return await sequelize.transaction(async (t) => {
    const stock = await Stock.findByPk(id, { transaction: t });
    if (!stock) throw new Error("Stock not found");

    const items = await StockItem.findAll({
      where: { stockId: id },
      transaction: t,
    });

    for (const item of items) {
      await decreaseStock(item.productId, item.quantity, t);
    }

    await StockItem.destroy({ where: { stockId: id }, transaction: t });
    await stock.destroy({ transaction: t });

    return { message: "Stock deleted and inventory adjusted." };
  });
};

// Get all stocks by user
export const getAllStocksService = async (userId) => {
  return await Stock.findAll({
    where: { userId },
    include: [
      {
        model: StockItem,
        include: [Product],
      },
    ],
    order: [["id", "DESC"]],
  });
};

// Get stock by id
export const getStockByIdService = async (id) => {
  return await Stock.findByPk(id, {
    include: [
      {
        model: StockItem,
        include: [Product],
      },
    ],
  });
};

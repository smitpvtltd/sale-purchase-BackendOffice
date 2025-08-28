import sequelize from "../Config/db.js";
import { Sell, SellItem } from "../Models/sellModel.js";
import { deductStockForSell, validateStockAvailability } from "./stockService.js";




// Create a new sell entry with items and deduct stock
export const createSellService = async (data) => {
  const { items, userId, ...sellData } = data;

  return await sequelize.transaction(async (t) => {
    // ✅ Step 1: Validate stock
    await validateStockAvailability(items, userId);

    // ✅ Step 2: Create sell
    const sell = await Sell.create({ ...sellData, userId }, { transaction: t });

    const sellItems = items.map(item => ({
      ...item,
      sellId: sell.id,
      userId,
    }));

    await SellItem.bulkCreate(sellItems, { transaction: t });

    // ✅ Step 3: Deduct stock
    await deductStockForSell(items, userId);

    return sell;
  });
};


// Get all sells for a user including items
export const getAllSellsService = async (userId) => {
  return await Sell.findAll({
    where: { userId },
    include: [{ model: SellItem }],
    order: [['id', 'DESC']],
  });
};


// Get a single sell by ID with its items
export const getSellByIdService = async (id) => {
  return await Sell.findByPk(id, {
    include: [SellItem],
  });
};



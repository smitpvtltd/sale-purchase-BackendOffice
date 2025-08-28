import Stock from '../Models/stockModel.js';
import StockItem from '../Models/stockItemModel.js';
import Product from '../Models/productModel.js';

// Create a new stock entry with items
  export const createStock = async ({ refNumber, userId, items }) => {
    return await sequelize.transaction(async (t) => {
      const stock = await Stock.create({ refNumber, userId }, { transaction: t });

      const stockItems = items.map(item => ({
        stockId: stock.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      await StockItem.bulkCreate(stockItems, { transaction: t });

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          product.totalQuantity += item.quantity;
          await product.save({ transaction: t });
        }
      }

      return stock;
    });
  };


// Get all stocks for a user including items and product info
export const getStocksByUser = async (userId) => {
  return await Stock.findAll({
    where: { userId },
    include: {
      model: StockItem,
      include: 'Product', // or Product model imported and used here
    },
    order: [['createdAt', 'DESC']],
  });
};

// Get a single stock by ID with its items and product details
export const getStockById = async (id) => {
  return await Stock.findByPk(id, {
    include: {
      model: StockItem,
      include: 'Product',
    },
  });
};

// Update stock reference number and replace its items
export const updateStock = async (id, { refNumber, items }) => {
  const stock = await Stock.findByPk(id);
  if (!stock) return null;

  // Subtract old quantities from Products
  const oldStockItems = await StockItem.findAll({ where: { stockId: id } });
  for (const oldItem of oldStockItems) {
    const product = await Product.findByPk(oldItem.productId);
    if (product) {
      product.totalQuantity -= oldItem.quantity;
      await product.save();
    }
  }

  await stock.update({ refNumber });

  await StockItem.destroy({ where: { stockId: id } });

  // Add new items and increment totalQuantity on Product
  const stockItems = items.map(item => ({
    stockId: id,
    productId: item.productId,
    quantity: item.quantity,
  }));
  await StockItem.bulkCreate(stockItems);

  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      product.totalQuantity += item.quantity;
      await product.save();
    }
  }

  return stock;
};



// Delete stock and its items
export const deleteStockById = async (id) => {
  const stock = await Stock.findByPk(id);
  if (!stock) return null;

  // Subtract quantities from Product.totalQuantity
  const stockItems = await StockItem.findAll({ where: { stockId: id } });
  for (const item of stockItems) {
    const product = await Product.findByPk(item.productId);
    if (product) {
      product.totalQuantity -= item.quantity;
      await product.save();
    }
  }

  await StockItem.destroy({ where: { stockId: id } });
  await stock.destroy();

  return stock;
};



// stock deduction 
export const deductStockForSell = async (sellItems) => {
  for (const item of sellItems) {
    const product = await Product.findByPk(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    if (product.totalQuantity < item.quantity) {
      throw new Error(`Insufficient stock for product: ${product.productName}`);
    }

    product.totalQuantity -= item.quantity;
    await product.save();
  }
};





// insufficient stock error handling
  export const validateStockAvailability = async (items) => {
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) throw new Error(`Product with ID ${item.productId} not found`);

    if (product.totalQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for product: ${product.productName} (required: ${item.quantity}, available: ${product.totalQuantity})`
      );
    }
  }
};

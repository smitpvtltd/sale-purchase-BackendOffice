import Stock from '../Models/stockModel.js';
import StockItem from '../Models/stockItemModel.js';
import Product from '../Models/productModel.js';
import sequelize from '../Config/db.js';



// Add new stock with items
  export const addStock = async (req, res) => {
    const t = await sequelize.transaction();  // start a transaction

    try {
      const { refNumber, userId, items } = req.body;

      if (!refNumber || !userId || !Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'refNumber, userId and items are required.' });
      }

      // Create Stock entry inside transaction
      const stock = await Stock.create({ refNumber, userId }, { transaction: t });

      // Create stock items inside transaction
      const stockItems = items.map(item => ({
        stockId: stock.id,
        productId: item.productId,
        quantity: item.quantity
      }));

      await StockItem.bulkCreate(stockItems, { transaction: t });

      // Update each Product totalQuantity inside transaction
      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          product.totalQuantity += item.quantity;
          await product.save({ transaction: t });
        }
      }

      await t.commit();  // commit transaction if all successful
      res.status(201).json({ message: 'Stock added successfully.', stockId: stock.id });
    } catch (error) {
      await t.rollback();  // rollback if error
      console.error('Add Stock Error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };


// Get all stocks for a user with items
export const getStocks = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const stocks = await Stock.findAll({
      where: { userId },
      include: {
        model: StockItem,
        include: Product,
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(stocks);
  } catch (error) {
    console.error('Get Stocks Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get single stock with items
export const getSingleStock = async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await Stock.findByPk(id, {
      include: {
        model: StockItem,
        include: Product,
      }
    });

    if (!stock) return res.status(404).json({ message: 'Stock not found.' });

    res.status(200).json(stock);
  } catch (error) {
    console.error('Get Single Stock Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Edit stock and its items
export const editStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { refNumber, items } = req.body;

    const stock = await Stock.findByPk(id);
    if (!stock) return res.status(404).json({ message: 'Stock not found.' });

    if (!refNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'refNumber and items are required.' });
    }

    await stock.update({ refNumber });

    // Delete existing items
    await StockItem.destroy({ where: { stockId: id } });

    // Add new items
    const stockItems = items.map(item => ({
      stockId: id,
      productId: item.productId,
      quantity: item.quantity
    }));

    await StockItem.bulkCreate(stockItems);

    res.status(200).json({ message: 'Stock updated successfully.' });
  } catch (error) {
    console.error('Edit Stock Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete stock and its items
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await Stock.findByPk(id);
    if (!stock) return res.status(404).json({ message: 'Stock not found.' });

    // Cascades delete items thanks to onDelete: 'CASCADE' in association, but safe to explicitly delete:
    await StockItem.destroy({ where: { stockId: id } });
    await stock.destroy();

    res.status(200).json({ message: 'Stock deleted successfully.' });
  } catch (error) {
    console.error('Delete Stock Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

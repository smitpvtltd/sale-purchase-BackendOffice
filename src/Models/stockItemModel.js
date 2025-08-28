import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import Product from './productModel.js';
import Stock from './stockModel.js';

const StockItem = sequelize.define('StockItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stockId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'stocks',
      key: 'id'
    },
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'id'
    },
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'stock_items',
  timestamps: true
});

Stock.hasMany(StockItem, { foreignKey: 'stockId' });
StockItem.belongsTo(Stock, { foreignKey: 'stockId' });

Product.hasMany(StockItem, { foreignKey: 'productId' });
StockItem.belongsTo(Product, { foreignKey: 'productId' });

export default StockItem;

import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  productName: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  productCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  hsnCode: { type: DataTypes.STRING, allowNull: false },
  gst: { type: DataTypes.STRING, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  images: { type: DataTypes.ARRAY(DataTypes.STRING) },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  totalQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'products',
  timestamps: true
});

export default Product;

import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import Subcategory from './subcategoryModel.js';  // Add Subcategory import


const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },category: {type: DataTypes.INTEGER,allowNull: false,references: {model: 'categories',key: 'id'}},
  subCat: {type: DataTypes.INTEGER,allowNull: false,references: {model: 'subcategories',key: 'id'}},
  productName: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  offerPrice: { type: DataTypes.FLOAT, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull:  false, defaultValue: 0 },
  barcode: { type: DataTypes.STRING, allowNull: false, unique: true },
  company: { type: DataTypes.STRING, allowNull: false },
  hsnCode: { type: DataTypes.STRING, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.STRING, allowNull: false },
  productCommission: { type: DataTypes.FLOAT, allowNull: false },
  images: { type: DataTypes.ARRAY(DataTypes.STRING) },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  totalQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'products',
  timestamps: true
});

// Define the relationship
Product.belongsTo(Subcategory, { foreignKey: 'subCat', as: 'subcategory' });

export default Product;

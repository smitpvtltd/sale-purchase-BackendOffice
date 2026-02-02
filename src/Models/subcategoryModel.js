import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import Category from './Category/categoryModel.js';
// import Product from './productModel.js';


const Subcategory = sequelize.define('Subcategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  subCatNm: { type: DataTypes.STRING, allowNull: false },
  categoryId: { type: DataTypes.INTEGER,allowNull: false,references: {model: Category,key: 'id',}}}, {
  tableName: 'subcategories',
  timestamps: true,
  indexes: [{unique: true,fields: ['subCatNm', 'categoryId']}]});

// Define the reverse relationship
// Subcategory.hasMany(Product, { foreignKey: 'subCat', as: 'products' });

export default Subcategory;

import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";

const Sell = sequelize.define("Sell", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  firmId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  totalDiscount: { type: DataTypes.FLOAT, allowNull: false },
  totalGST: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
}, {
  tableName: "sells",
  timestamps: true,
});

const SellItem = sequelize.define("SellItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sellId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  discount: { type: DataTypes.FLOAT, allowNull: true },
  gst: { type: DataTypes.FLOAT, allowNull: true },
  cgst: { type: DataTypes.FLOAT, allowNull: true },
  sgst: { type: DataTypes.FLOAT, allowNull: true },
  igst: { type: DataTypes.FLOAT, allowNull: true },
  totalPrice: { type: DataTypes.FLOAT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "sell_items",
  timestamps: true,
});

Sell.belongsTo(Customer, { foreignKey: "customerId" });
Sell.hasMany(SellItem, { foreignKey: "sellId", onDelete: "CASCADE" });
SellItem.belongsTo(Sell, { foreignKey: "sellId" }); 
SellItem.belongsTo(Product, { foreignKey: "productId" });

export { Sell, SellItem };

import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import PurchaseParty from "./purchasePartyModel.js";
import Product from "./productModel.js";

const Purchase = sequelize.define("Purchase", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  purchasePartyId: { type: DataTypes.INTEGER, allowNull: false },
  firmId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  totalDiscount: { type: DataTypes.FLOAT, allowNull: false },
  totalGST: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
}, {
  tableName: "purchases",
  timestamps: true,
});

const PurchaseItem = sequelize.define("PurchaseItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  purchaseId: { type: DataTypes.INTEGER, allowNull: false },
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
  tableName: "purchase_items",
  timestamps: true,
});

// Associations
Purchase.belongsTo(PurchaseParty, { foreignKey: "purchasePartyId", as: "purchaseParty", });
PurchaseItem.belongsTo(Product, { foreignKey: "productId", onDelete: "CASCADE" });
Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId", onDelete: "CASCADE" });

export { Purchase, PurchaseItem };

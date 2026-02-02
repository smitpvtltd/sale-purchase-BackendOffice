import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Firm from "./firmModel.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";

const Return = sequelize.define(
  "Return",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false },
    returnBillNo: { type: DataTypes.STRING },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    firmId: { type: DataTypes.INTEGER, allowNull: false },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    grandTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    totalReturnAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMethod: { type: DataTypes.STRING },
    paymentStatus: { type: DataTypes.STRING },
  },
  {
    tableName: "returns",
    timestamps: true,
  }
);

const ReturnItem = sequelize.define(
  "ReturnItem",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    returnId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "return_items",
    timestamps: true,
  }
);

// Associations
Return.belongsTo(Firm, { foreignKey: "firmId" });
Return.belongsTo(Customer, { foreignKey: "customerId" });
Return.hasMany(ReturnItem, { foreignKey: "returnId", as: "items", onDelete: "CASCADE" });
ReturnItem.belongsTo(Return, { foreignKey: "returnId" });
ReturnItem.belongsTo(Product, { foreignKey: "productId" });

export { Return, ReturnItem };

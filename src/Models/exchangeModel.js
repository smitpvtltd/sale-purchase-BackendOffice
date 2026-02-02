import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Firm from "./firmModel.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";

const Exchange = sequelize.define(
  "Exchange",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false },
    exchangeBillNo: { type: DataTypes.STRING },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    firmId: { type: DataTypes.INTEGER, allowNull: false },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    difference: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    differenceType: { type: DataTypes.STRING }, // 'Payable' or 'Receivable'

    // Financials
    subtotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    billDiscount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    billDiscountType: { type: DataTypes.STRING, defaultValue: "₹" }, // ✅ new
    returnTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // ✅ new
    gst: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    grandTotal: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    payingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMethod: { type: DataTypes.STRING },
    paymentStatus: { type: DataTypes.STRING },
  },
  {
    tableName: "exchanges",
    timestamps: true,
  }
);

const ExchangeReturnItem = sequelize.define(
  "ExchangeReturnItem",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    exchangeId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
    discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "exchange_return_items", timestamps: true }
);

const ExchangeGivenItem = sequelize.define(
  "ExchangeGivenItem",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    exchangeId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    offerPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    discountType: { type: DataTypes.STRING, defaultValue: "₹" }, // ✅ new
    total: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "exchange_given_items", timestamps: true }
);

// Associations
Exchange.belongsTo(Firm, { foreignKey: "firmId" });
Exchange.belongsTo(Customer, { foreignKey: "customerId" });

Exchange.hasMany(ExchangeReturnItem, { foreignKey: "exchangeId", as: "returnedItems", onDelete: "CASCADE" });
Exchange.hasMany(ExchangeGivenItem, { foreignKey: "exchangeId", as: "givenItems", onDelete: "CASCADE" });

ExchangeReturnItem.belongsTo(Exchange, { foreignKey: "exchangeId" });
ExchangeGivenItem.belongsTo(Exchange, { foreignKey: "exchangeId" });

ExchangeReturnItem.belongsTo(Product, { foreignKey: "productId" });
ExchangeGivenItem.belongsTo(Product, { foreignKey: "productId" });

export { Exchange, ExchangeReturnItem, ExchangeGivenItem };

import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";

const Sell = sequelize.define("Sell", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  firmId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  totalDiscount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  billDiscountType: { type: DataTypes.STRING, allowNull: false, defaultValue: "₹"},
  totalGST: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  cgst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  sgst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  igst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  finalAmount: { type: DataTypes.FLOAT, allowNull: false },

  // Payment
  paymentMethod: { type: DataTypes.STRING, allowNull: false }, // Cash / Online / Cheque
  paymentDetails: { type: DataTypes.JSON }, // { chequeNo, bankName, txnId, ... }

    // ✅ balance and paying amount
  payingAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  balanceAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  transactionId: { type: DataTypes.INTEGER, allowNull: false },
  onlinePaymentMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
  transactionId: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
  chequeNumber: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
  chequeBankName: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
  chequeDate: { type: DataTypes.STRING, allowNull: false, defaultValue: "NA" },
}, {
  tableName: "sells",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["invoiceNumber", "userId"], // invoice unique per user
    }
  ]
});

const SellItem = sequelize.define("SellItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sellId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  size: { type: DataTypes.STRING, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  offerPrice: { type: DataTypes.FLOAT, allowNull: false },
  discount: { type: DataTypes.FLOAT, allowNull: false },
  discountType: { type: DataTypes.STRING, allowNull: true, defaultValue: "₹" },
  // gst: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  totalPrice: { type: DataTypes.FLOAT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "sell_items",
  timestamps: true,
});

// ================== Relations ================== //
Sell.belongsTo(Customer, { foreignKey: "customerId" });
Sell.hasMany(SellItem, { foreignKey: "sellId", as: "items", onDelete: "CASCADE" });

SellItem.belongsTo(Sell, { foreignKey: "sellId" });
SellItem.belongsTo(Product, { foreignKey: "productId" });

export { Sell, SellItem };

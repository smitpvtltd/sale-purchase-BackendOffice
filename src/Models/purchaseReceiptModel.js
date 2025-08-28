import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Firm from './firmModel.js';
import Customer from './customerModel.js';




const PurchaseReceipt = sequelize.define(
  "PurchaseReceipt",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    billNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    firmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "firms",
        key: "id",
      },
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "purchase_parties",
        key: "id",
      },
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    netBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    narration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentMode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payingAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    balanceAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    chequeNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    chequeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    onlinePaymentType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    tableName: "purchase_receipts",
  }
);


PurchaseReceipt.belongsTo(Firm, { foreignKey: 'firmId', as: 'firm' });
PurchaseReceipt.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

export default PurchaseReceipt;

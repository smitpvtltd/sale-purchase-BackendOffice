import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Firm from "./firmModel.js";
import Receipt from "./receiptModel.js"; // Sale Receipt
import PurchaseReceipt from "./purchaseReceiptModel.js"; // Purchase Receipt
// import users from "./userModel.js";

const AdvanceSettlement = sequelize.define(
  "AdvanceSettlement",
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
    settlementNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    billType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["sale", "purchase"]], // Only sale or purchase allowed
      },
    },
    firmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "firms",
        key: "id",
      },
    },
    receiptId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    advanceAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    billDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    tableName: "advance_settlements",
    timestamps: true,
  }
);

// Relationships
AdvanceSettlement.belongsTo(Firm, { foreignKey: "firmId", as: "firm" });

// Dynamic association based on `billType` value (either 'sale' or 'purchase')
AdvanceSettlement.belongsTo(Receipt, {
  foreignKey: "receiptId",
  as: "saleReceipt",
  constraints: false, // Disable foreign key constraints as the model can relate to two different receipt types.
});

AdvanceSettlement.belongsTo(PurchaseReceipt, {
  foreignKey: "receiptId",
  as: "purchaseReceipt",
  constraints: false, // Disable foreign key constraints as the model can relate to two different receipt types.
});

export default AdvanceSettlement;

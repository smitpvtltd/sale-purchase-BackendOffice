import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";
import Firm from "./firmModel.js";

// --- Main Quotation Model ---
const QuotationModel = sequelize.define(
  "QuotationModel",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    partyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isGstApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transportationCharges: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    grandTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "quotation",
    timestamps: true,
  }
);

// --- Quotation Item Model ---
const QuotationModelItem = sequelize.define(
  "QuotationModelItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hsnCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uom: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    gst: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "quotation_items",
    timestamps: true,
  }
);

// --- Associations ---
QuotationModel.belongsTo(Customer, { foreignKey: "partyId" });
QuotationModel.belongsTo(Firm, { foreignKey: "firmId" });
QuotationModel.hasMany(QuotationModelItem, {
  foreignKey: "quotationId",
  onDelete: "CASCADE",
});
QuotationModelItem.belongsTo(QuotationModel, {
  foreignKey: "quotationId",
});
QuotationModelItem.belongsTo(Product, {
  foreignKey: "productId",
});

export { QuotationModel, QuotationModelItem };

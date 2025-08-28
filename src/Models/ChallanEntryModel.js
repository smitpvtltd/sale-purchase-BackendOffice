import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import Customer from "./customerModel.js";
import Product from "./productModel.js";
import Firm from "./firmModel.js"; // Make sure this exists

const DeliveryChallan = sequelize.define(
  "DeliveryChallan",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    billNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
      type: DataTypes.STRING, // "withGST" or "commonGST"
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
    tableName: "delivery_challans",
    timestamps: true,
  }
);

const DeliveryChallanItem = sequelize.define(
  "DeliveryChallanItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    challanId: {
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
    tableName: "delivery_challan_items",
    timestamps: true,
  }
);

// Associations
DeliveryChallan.belongsTo(Customer, { foreignKey: "partyId" });
DeliveryChallan.belongsTo(Firm, { foreignKey: "firmId" });
DeliveryChallan.hasMany(DeliveryChallanItem, {
  foreignKey: "challanId",
  onDelete: "CASCADE",
});
DeliveryChallanItem.belongsTo(DeliveryChallan, {
  foreignKey: "challanId",
});
DeliveryChallanItem.belongsTo(Product, {
  foreignKey: "productId",
});

export { DeliveryChallan, DeliveryChallanItem };

import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";




const InvoiceNumber = sequelize.define(
  "InvoiceNumber",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastInvoiceNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "invoice_numbers",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["year", "prefix"], // ✅ composite unique key
      },
    ],
  }
);


export default InvoiceNumber;

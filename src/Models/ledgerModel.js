import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

const Ledger = sequelize.define(
  "Ledger",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    entryDate: { type: DataTypes.DATEONLY, allowNull: false },
    entryType: { type: DataTypes.STRING, allowNull: false },
    entryTypeLabel: { type: DataTypes.STRING, allowNull: true },
    voucherNumber: { type: DataTypes.STRING, allowNull: true },
    sourceType: { type: DataTypes.STRING, allowNull: true },
    sourceId: { type: DataTypes.INTEGER, allowNull: true },
    referenceType: { type: DataTypes.STRING, allowNull: true },
    referenceId: { type: DataTypes.STRING, allowNull: true },
    firmId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    partyType: { type: DataTypes.STRING, allowNull: true },
    partyId: { type: DataTypes.INTEGER, allowNull: true },
    partyName: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    debitAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    creditAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    paymentMode: { type: DataTypes.STRING, allowNull: true },
    paymentStatus: { type: DataTypes.STRING, allowNull: true },
    narration: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  {
    tableName: "ledgers",
    timestamps: true,
  },
);

export default Ledger;

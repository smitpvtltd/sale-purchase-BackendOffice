import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import AdvanceSettlement from "./AdvanceSettlementModel.js";

const AdvanceSettlementAllocation = sequelize.define(
  "AdvanceSettlementAllocation",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    settlementId: { type: DataTypes.INTEGER, allowNull: false },
    billType: {
      type: DataTypes.ENUM("sale", "purchase"),
      allowNull: false,
    },
    billId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "advance_settlement_allocations",
    timestamps: true,
  },
);

AdvanceSettlement.hasMany(AdvanceSettlementAllocation, {
  foreignKey: "settlementId",
  as: "allocations",
  onDelete: "CASCADE",
});

AdvanceSettlementAllocation.belongsTo(AdvanceSettlement, {
  foreignKey: "settlementId",
});

export default AdvanceSettlementAllocation;

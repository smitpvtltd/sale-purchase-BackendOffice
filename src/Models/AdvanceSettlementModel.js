import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const AdvanceSettlement = sequelize.define('AdvanceSettlement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: {type: DataTypes.DATEONLY,allowNull: false,},
  settlementNumber: {type: DataTypes.STRING,allowNull: false,unique: true,}, // assuming settlement number is unique globally
  firmId: {type: DataTypes.INTEGER,allowNull: false},
  partyType: {
    type: DataTypes.ENUM("customer", "purchase_party"),
    allowNull: false,
  },
  partyId: {type: DataTypes.INTEGER,allowNull: false},
  advanceAmount: {type: DataTypes.DECIMAL(15, 2),allowNull: false},
  appliedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  unappliedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  settlementStatus: {
    type: DataTypes.ENUM("unapplied", "partial", "applied"),
    allowNull: false,
    defaultValue: "unapplied",
  },
  userId: {type: DataTypes.INTEGER,allowNull: false}
}, {
  tableName: 'advance_settlements',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['settlementNumber'],
    },
  ],
});

export default AdvanceSettlement;

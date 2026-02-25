import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const Stock = sequelize.define('Stock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stockDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: new Date() },
  refNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  employeeName: { type: DataTypes.STRING, allowNull: false },
  purchasePartyName: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'stocks',
  timestamps: true
});

export default Stock;

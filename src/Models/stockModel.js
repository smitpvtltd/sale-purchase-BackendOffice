import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const Stock = sequelize.define('Stock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  refNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  employeeName: { type: DataTypes.STRING, allowNull: false},
}, {
  tableName: 'stocks',
  timestamps: true
});

export default Stock;

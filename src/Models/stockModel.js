import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const Stock = sequelize.define('Stock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  refNumber: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'stocks',
  timestamps: true
});

export default Stock;

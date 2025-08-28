import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const State = sequelize.define('State', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  statename: { type: DataTypes.STRING, allowNull: false },
  codes: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'states',
  timestamps: false
});

export default State;

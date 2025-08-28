import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import State from './stateModel.js';

const City = sequelize.define('City', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stateId: { type: DataTypes.INTEGER, allowNull: false },
  citynm: { type: DataTypes.STRING, allowNull: false },
    edt: {type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW, field: 'edt'}}, {
  tableName: 'cities',
  timestamps: false
});

// Association
// City.belongsTo(State, { foreignKey: 'stateId' });
// State.hasMany(City, { foreignKey: 'id' });

export default City;

import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const MenuItem = sequelize.define('MenuItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  roles: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'menu_items',
  timestamps: false,
});

export default MenuItem;

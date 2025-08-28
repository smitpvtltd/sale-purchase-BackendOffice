import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  contact: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING },
  firmId: { type: DataTypes.INTEGER, allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  viewPages: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
}, {
  tableName: 'employees',
  timestamps: true,
});

export default Employee;
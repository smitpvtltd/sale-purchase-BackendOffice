import { DataTypes } from 'sequelize';
import sequelize from '../Config/db.js';
import User from './userModel.js';

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {type: DataTypes.INTEGER,allowNull: false, references: {model: User ,key: "id",},onDelete: "CASCADE"},
  date: { type: DataTypes.DATEONLY, allowNull: false },
  toWhom: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: false },
  // ✅ Changed to INTEGER
  expenseType: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'expenses',
  timestamps: true,
});

User.hasMany(Expense, { foreignKey: "userId" });
Expense.belongsTo(User, { foreignKey: "userId" });

export default Expense;

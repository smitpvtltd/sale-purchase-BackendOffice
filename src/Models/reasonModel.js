import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

const Reason = sequelize.define("Reason", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reason: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false }, // ✅ ADD THIS
}, {
  tableName: "reasons",
  timestamps: true,
});

export default Reason;

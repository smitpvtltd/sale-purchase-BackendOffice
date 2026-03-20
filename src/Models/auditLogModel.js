import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    module: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    oldValue: { type: DataTypes.JSONB, allowNull: true },
    newValue: { type: DataTypes.JSONB, allowNull: true },
    userId: { type: DataTypes.STRING, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
  },
);

export default AuditLog;

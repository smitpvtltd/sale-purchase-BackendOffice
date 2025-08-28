import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import City from "./cityModel.js";
import State from "./stateModel.js";

const PurchaseParty = sequelize.define(
  "PurchaseParty",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.INTEGER, allowNull: false },
    city: { type: DataTypes.INTEGER, allowNull: false },
    gstNumber: { type: DataTypes.STRING, allowNull: true },
    companyName: { type: DataTypes.STRING, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stateType: {
      type: DataTypes.ENUM("in_state", "out_of_state"),
      allowNull: false,
      defaultValue: "in_state",
    },
  },
  {
    tableName: "purchase_parties",
    timestamps: true,
  }
);

// Associations
PurchaseParty.belongsTo(State, { foreignKey: "state" });
PurchaseParty.belongsTo(City, { foreignKey: "city" });

State.hasMany(PurchaseParty, { foreignKey: "state" });
City.hasMany(PurchaseParty, { foreignKey: "city" });

export default PurchaseParty;

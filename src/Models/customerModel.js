import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import City from "./cityModel.js";
import State from "./stateModel.js";

const Customer = sequelize.define(
  "Customer",
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
    userId: {type: DataTypes.INTEGER, allowNull: false },
    stateType: {
      type: DataTypes.ENUM("in_state", "out_of_state"),
      allowNull: false,
      defaultValue: "in_state",
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);

// ✅ Correct foreign key setup
Customer.belongsTo(State, { foreignKey: "state" });
Customer.belongsTo(City, { foreignKey: "city" });

State.hasMany(Customer, { foreignKey: "state" });
City.hasMany(Customer, { foreignKey: "city" });

export default Customer;

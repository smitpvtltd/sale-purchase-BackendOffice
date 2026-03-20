import { DataTypes } from "sequelize";
import sequelize from "../Config/db.js";
import City from "./cityModel.js";
import State from "./stateModel.js";

const Customer = sequelize.define(
  "Customer",
  {
    id: {type: DataTypes.INTEGER,primaryKey: true,autoIncrement: true},
    name: { type: DataTypes.STRING, allowNull: false },
    firmId: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.INTEGER, allowNull: true },
    city: { type: DataTypes.INTEGER, allowNull: true },
    gstNumber: { type: DataTypes.STRING, allowNull: true },
    accountName: { type: DataTypes.STRING, allowNull: true },
    bankName: { type: DataTypes.STRING, allowNull: true },
    accountNumber: { type: DataTypes.STRING, allowNull: true },
    ifscCode: { type: DataTypes.STRING, allowNull: true },
      // ✅ JSON for multiple images (works with MySQL, PostgreSQL)
  customerImg: {
    type: DataTypes.JSONB, // or DataTypes.JSON if using MySQL
    allowNull: true,
    defaultValue: [],
  },
    userId: {type: DataTypes.INTEGER, allowNull: false },
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

import "dotenv/config";
import sequelize from "../../Config/db.js";
import Employee from "../../Models/employeeModel.js";

// Import JSON (Node 20+)
import employeeList from "./employee.json" with { type: "json" };

const seedEmployees = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ force: false });

    const newEmployeeList = employeeList.map((emp) => ({
      name: emp.emp_name,
      contact: "9999999999", // dummy
      email: "not_available@example.com", // required
      address: "N/A", // required
      image: null,
      firmId: emp.firm_id, // from json
      userName: emp.emp_name,
      password: "0101",
      userId: 2,
      viewPages: [1, 5],
    }));

    await Employee.bulkCreate(newEmployeeList);

    console.log("✅ Employees imported successfully!");
  } catch (error) {
    console.error("❌ Failed to import employees:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedEmployees();

import "dotenv/config";
import sequelize from "../../Config/db.js";
import Customer from "../../Models/customerModel.js";
import customerList from "./customer.json" with { type: "json" };

const seedCustomers = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ force: false });

    const newCustomerList = customerList.map((cust, index) => {
      let mobile = cust.contact;

      // Assign dummy number if missing
      if (!mobile || mobile === "0") {
        mobile = `99999000${index}`; // dummy unique number
      }

      return {
        name: cust.pName,
        mobile: mobile,
        userId: 2,
        stateType: "in_state",
        state: null,
        city: null,
      };
    });

    await Customer.bulkCreate(newCustomerList);

    console.log("✅ Customers imported successfully!");
  } catch (error) {
    console.log("❌ Error importing customers:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedCustomers();

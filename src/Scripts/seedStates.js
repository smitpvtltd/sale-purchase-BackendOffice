import sequelize from "../Config/db.js";
import State from "../Models/stateModel.js";

const seedStates = async () => {
  try {
    await sequelize.sync({ force: false });

    await State.bulkCreate([
      { id: 1, statename: "Andaman and Nicobar Islands", codes: "35" },
      { id: 2, statename: "Andhra Pradesh", codes: "28" },
      { id: 3, statename: "Andhra Pradesh (New)", codes: "37" },
      { id: 4, statename: "Arunachal Pradesh", codes: "12" },
      { id: 5, statename: "Assam", codes: "18" },
      { id: 6, statename: "Bihar", codes: "10" },
      { id: 7, statename: "Chandigarh", codes: "4" },
      { id: 8, statename: "Chattisgarh", codes: "22" },
      { id: 9, statename: "Dadra and Nagar Haveli", codes: "26" },
      { id: 10, statename: "Daman and Diu", codes: "25" },
      { id: 11, statename: "Delhi", codes: "7" },
      { id: 12, statename: "Goa", codes: "30" },
      { id: 13, statename: "Gujarat", codes: "24" },
      { id: 14, statename: "Haryana", codes: "6" },
      { id: 15, statename: "Himachal Pradesh", codes: "2" },
      { id: 16, statename: "Jammu and Kashmir", codes: "1" },
      { id: 17, statename: "Jharkhand", codes: "20" },
      { id: 18, statename: "Karnataka", codes: "29" },
      { id: 19, statename: "Kerala", codes: "32" },
      { id: 20, statename: "Lakshadweep", codes: "31" },
      { id: 21, statename: "Madhya Pradesh", codes: "23" },
      { id: 22, statename: "Maharashtra", codes: "27" },
      { id: 23, statename: "Manipur", codes: "14" },
      { id: 24, statename: "Meghalaya", codes: "17" },
      { id: 25, statename: "Mizoram", codes: "15" },
      { id: 26, statename: "Nagaland", codes: "13" },
      { id: 27, statename: "Orissa", codes: "21" },
      { id: 28, statename: "Pondicherry", codes: "34" },
      { id: 29, statename: "Punjab", codes: "3" },
      { id: 30, statename: "Rajasthan", codes: "8" },
      { id: 31, statename: "Sikkim", codes: "11" },
      { id: 32, statename: "Tamil Nadu", codes: "33" },
      { id: 33, statename: "Tripura", codes: "16" },
      { id: 34, statename: "Uttar Pradesh", codes: "9" },
      { id: 35, statename: "Uttaranchal", codes: "5" },
      { id: 36, statename: "West Bengal", codes: "19" }
    ]);

    console.log("States seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed states:", error);
    process.exit(1);
  }
};

seedStates();
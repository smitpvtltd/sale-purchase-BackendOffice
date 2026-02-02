import "dotenv/config";
import sequelize from "../../Config/db.js";
import Reason from "../../Models/reasonModel.js";
import reasons from "./reason.json" with { type: "json" };

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");
    await sequelize.sync({ alter: false });

    const reasonMap = {};

    for (const r of reasons) {
      const name = (r.reason || r.reasonName || r.reason_text || "").trim();
      if (!name) continue;

      let found = await Reason.findOne({ where: { reason: name } });
      if (!found) {
        found = await Reason.create({ reason: name, userId: 2 });
      }
      reasonMap[name] = found.id;
    }

    console.log("✅ Reason map:");
    console.log(JSON.stringify(reasonMap, null, 2));
    // copy this output into src/Scripts/reasonMap.json
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();

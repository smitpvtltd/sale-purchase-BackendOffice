import "dotenv/config";
import sequelize from "../../Config/db.js";
import Product from "../../Models/productModel.js";

// JSON imports
import items from "./items.json" with { type: "json" };
import stocks from "./stock_with_barcode.json" with { type: "json" };

const seedProducts = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    await sequelize.sync({ force: false });

    // 1️⃣ Build lookup for itemId → name
    const itemNameMap = {};
    items.forEach((item) => {
      itemNameMap[item.Id] = item.item_full_name?.trim() || "Unnamed Product";
    });

    // 2️⃣ Convert stock json into Products
    const newProducts = stocks.map((stock) => ({
      category: 1,  // dummy category
      subCat: 1,    // dummy subcategory
      productName: itemNameMap[stock.itemId] || "Unknown",
      price: Number(stock.mrp),
      offerPrice: Number(stock.discRate),
      qty: Number(stock.balQty),
      totalQuantity: Number(stock.qty),
      barcode: stock.barcode,
      company: "Default",
      hsnCode: String(stock.hsn_code || "0000"),
      unit: "PCS",
      size: stock.size || "FREE",
      productCommission: Number(stock.commission),
      images: [],
      userId: 2,
    }));

    await Product.bulkCreate(newProducts);

    console.log("✅ Products seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed products:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedProducts();
import sequelize from "../Config/db.js";
import Firm from "../Models/firmModel.js";
import Customer from "../Models/customerModel.js";
import {
  DeliveryChallan,
  DeliveryChallanItem,
} from "../Models/ChallanEntryModel.js";
import Product from "../Models/productModel.js";

// ✅ Create Challan
export const createChallanService = async (data) => {
  const {
    firmId,
    billNumber,
    userId,
    products,
    transportationCharges = 0,
    ...rest
  } = data;

  let subtotal = 0;

  const challanItems = products.map((item) => {
    const itemSubtotal = item.price * item.quantity - (item.discount || 0);
    const gstAmount = (itemSubtotal * (item.gst || 0)) / 100;
    const totalWithGst = itemSubtotal + gstAmount;

    subtotal += totalWithGst;

    return {
      challanId: null, // assigned later
      productId: item.productId,
      hsnCode: item.hsnCode,
      productCode: item.productCode,
      uom: item.uom,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      gst: item.gst || 0,
      subtotal: totalWithGst,
      userId,
    };
  });

  const grandTotal = subtotal + parseFloat(transportationCharges || 0);

  return await sequelize.transaction(async (t) => {
    const challan = await DeliveryChallan.create(
      {
        billNumber,
        firmId,
        userId,
        transportationCharges,
        subtotal,
        grandTotal,
        ...rest,
      },
      { transaction: t }
    );

    challanItems.forEach((item) => (item.challanId = challan.id));
    await DeliveryChallanItem.bulkCreate(challanItems, { transaction: t });

    return challan;
  });
};

// ✅ Get all delivery challans for a user
export const getAllChallansService = async (userId) => {
  return await DeliveryChallan.findAll({
    where: { userId },
    include: [
      {
        model: DeliveryChallanItem,
        include: [
          {
            model: Product,
            attributes: ["id", "productName"],
          },
        ],
      },
      {
        model: Firm,
        attributes: ["id", "firmName"],
      },
      {
        model: Customer,
        attributes: ["id", "name"],
      },
    ],
    order: [["id", "DESC"]],
  });
};

// ✅ Get a single delivery challan by ID
export const getChallanByIdService = async (id) => {
  return await DeliveryChallan.findByPk(id, {
    include: [DeliveryChallanItem],
  });
};

// ✅ Update delivery challan (Edit)
export const updateChallanService = async (id, data) => {
  const { products, userId, ...updatedData } = data;

  return await sequelize.transaction(async (t) => {
    const existingChallan = await DeliveryChallan.findByPk(id, {
      include: [DeliveryChallanItem],
    });

    if (!existingChallan) {
      throw new Error("Challan not found.");
    }

    // 1. Restore previous stock
    const oldItems = existingChallan.DeliveryChallanItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    await restoreStockForSell(oldItems, userId);

    // 2. Validate stock for new items
    await validateStockAvailability(products, userId);

    // 3. Update challan
    await existingChallan.update(updatedData, { transaction: t });

    // 4. Remove old items
    await DeliveryChallanItem.destroy({
      where: { challanId: id },
      transaction: t,
    });

    // 5. Add new items
    const newItems = products.map((item) => ({
      ...item,
      challanId: id,
      userId,
    }));
    await DeliveryChallanItem.bulkCreate(newItems, { transaction: t });

    // 6. Deduct new stock
    await deductStockForSell(products, userId);

    return existingChallan;
  });
};

// ✅ Delete delivery challan
export const deleteChallanService = async (id, userId) => {
  return await sequelize.transaction(async (t) => {
    const challan = await DeliveryChallan.findByPk(id, {
      include: [DeliveryChallanItem],
    });

    if (!challan) {
      throw new Error("Challan not found.");
    }

    // 1. Restore stock before deleting
    const items = challan.DeliveryChallanItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await restoreStockForSell(items, userId);

    // 2. Delete items and challan
    await DeliveryChallanItem.destroy({
      where: { challanId: id },
      transaction: t,
    });

    await DeliveryChallan.destroy({
      where: { id },
      transaction: t,
    });

    return { message: "Challan deleted successfully." };
  });
};

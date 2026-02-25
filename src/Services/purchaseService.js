import { Purchase, PurchaseItem } from "../Models/purchaseModel.js";
import { decreaseStock, increaseStock } from "../Middleware/stockService.js";
import PurchaseParty from "../Models/purchasePartyModel.js";
import sequelize from "../Config/db.js";

// add purchase service
export const createPurchaseService = async (data) => {
  const { items, userId, ...purchaseData } = data;

  return await sequelize.transaction(async (t) => {
    const purchase = await Purchase.create(
      { ...purchaseData, userId },
      { transaction: t },
    );

    const purchaseItems = items.map((item) => ({
      ...item,
      purchaseId: purchase.id,
      userId,
    }));
    for (const item of items) {
      if (item.gst < 0 || item.cgst < 0 || item.sgst < 0 || item.igst < 0) {
        throw new Error("Invalid GST values detected");
      }
    }

    await PurchaseItem.bulkCreate(purchaseItems, { transaction: t });

    // ✅ 3. Increase stock for each item
    for (const item of items) {
      await increaseStock(item.productId, item.quantity);
    }

    return purchase;
  });
};

// edit purchase
export const updatePurchaseService = async (id, updatedData) => {
  const { items, userId, ...purchaseDetails } = updatedData;

  return await sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(id, { transaction: t });
    if (!purchase) throw new Error("Purchase not found");

    // 1. Decrease stock for old items
    const oldItems = await PurchaseItem.findAll({
      where: { purchaseId: id },
      transaction: t,
    });
    for (const old of oldItems) {
      await decreaseStock(old.productId, old.quantity); // ✅ use stockService
    }

    // 2. Replace items and update purchase
    await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
    await purchase.update(purchaseDetails, { transaction: t });

    const newItems = items.map((item) => ({
      ...item,
      purchaseId: id,
      userId,
    }));
    await PurchaseItem.bulkCreate(newItems, { transaction: t });

    // 3. Increase stock for new items
    for (const item of items) {
      await increaseStock(item.productId, item.quantity); // ✅ use stockService
    }

    return purchase;
  });
};

// delete purchase
export const deletePurchaseService = async (id) => {
  return await sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(id, { transaction: t });
    if (!purchase) throw new Error("Purchase not found");

    const purchaseItems = await PurchaseItem.findAll({
      where: { purchaseId: id },
      transaction: t,
    });

    // 1. Decrease stock for each item
    for (const item of purchaseItems) {
      await decreaseStock(item.productId, item.quantity); // ✅ use stockService
    }

    // 2. Delete items and the purchase
    await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
    await purchase.destroy({ transaction: t });

    return { message: "Purchase deleted and inventory adjusted." };
  });
};

// get all purchases
export const getAllPurchasesService = async (userId) => {
  return await Purchase.findAll({
    where: { userId },
    include: [
      { model: PurchaseItem },
      {
        model: PurchaseParty,
        as: "purchaseParty",
        attributes: ["id", "name"],
      },
    ],
    order: [["id", "DESC"]],
  });
};

// get purchase by id
export const getPurchaseByIdService = async (id) => {
  return await Purchase.findByPk(id, {
    include: [
      { model: PurchaseItem },
      {
        model: PurchaseParty,
        as: "purchaseParty",
        attributes: ["id", "name"],
      },
    ],
  });
};

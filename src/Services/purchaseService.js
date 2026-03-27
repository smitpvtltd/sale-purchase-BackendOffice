import { Purchase, PurchaseItem } from "../Models/purchaseModel.js";
import { decreaseStock, increaseStock } from "../Middleware/stockService.js";
import PurchaseParty from "../Models/purchasePartyModel.js";
import sequelize from "../Config/db.js";
import { Op } from "sequelize";
import Product from "../Models/productModel.js";

const syncPurchasedProductDetails = async (productId, item, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);

  product.price = Number(item.price || 0);
  product.offerPrice = Number(item.offerPrice ?? item.price ?? 0);
  product.gst = Number(item.gst || 0);
  product.cgst = Number(item.cgst || 0);
  product.sgst = Number(item.sgst || 0);
  product.igst = Number(item.igst || 0);
  await product.save({ transaction });
};

export const createPurchaseService = async (data) => {
  const { items, userId, ...purchaseData } = data;

  return sequelize.transaction(async (t) => {
    const purchase = await Purchase.create(
      { ...purchaseData, userId },
      { transaction: t },
    );

    const purchaseItems = items.map((item) => ({
      ...item,
      offerPrice: item.offerPrice ?? item.price ?? 0,
      purchaseId: purchase.id,
      userId,
    }));

    for (const item of items) {
      if (item.gst < 0 || item.cgst < 0 || item.sgst < 0 || item.igst < 0) {
        throw new Error("Invalid GST values detected");
      }
    }

    await PurchaseItem.bulkCreate(purchaseItems, { transaction: t });

    for (const item of items) {
      await syncPurchasedProductDetails(item.productId, item, t);
      await increaseStock(item.productId, item.quantity, t);
    }

    return purchase;
  });
};

export const updatePurchaseService = async (id, updatedData) => {
  const { items, userId, ...purchaseDetails } = updatedData;

  return sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(id, { transaction: t });
    if (!purchase) throw new Error("Purchase not found");

    const oldItems = await PurchaseItem.findAll({
      where: { purchaseId: id },
      transaction: t,
    });

    for (const old of oldItems) {
      await decreaseStock(old.productId, old.quantity, t);
    }

    await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
    await purchase.update(purchaseDetails, { transaction: t });

    const newItems = items.map((item) => ({
      ...item,
      offerPrice: item.offerPrice ?? item.price ?? 0,
      purchaseId: id,
      userId,
    }));

    await PurchaseItem.bulkCreate(newItems, { transaction: t });

    for (const item of items) {
      await syncPurchasedProductDetails(item.productId, item, t);
      await increaseStock(item.productId, item.quantity, t);
    }

    return purchase;
  });
};

export const deletePurchaseService = async (id) => {
  return sequelize.transaction(async (t) => {
    const purchase = await Purchase.findByPk(id, { transaction: t });
    if (!purchase) throw new Error("Purchase not found");

    const purchaseItems = await PurchaseItem.findAll({
      where: { purchaseId: id },
      transaction: t,
    });

    for (const item of purchaseItems) {
      await decreaseStock(item.productId, item.quantity, t);
    }

    await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
    await purchase.destroy({ transaction: t });

    return { message: "Purchase deleted and inventory adjusted." };
  });
};

export const getAllPurchasesService = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.firmId) {
    where.firmId = filters.firmId;
  }

  if (filters.purchasePartyId) {
    where.purchasePartyId = filters.purchasePartyId;
  }

  if (filters.pendingOnly) {
    where.balanceAmount = { [Op.gt]: 0 };
  }

  return Purchase.findAll({
    where,
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

export const getPurchaseByIdService = async (id) => {
  return Purchase.findByPk(id, {
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

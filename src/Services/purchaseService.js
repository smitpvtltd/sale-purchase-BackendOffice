import { Purchase, PurchaseItem } from "../Models/purchaseModel.js";
import Product from "../Models/productModel.js";
import PurchaseParty from '../Models/purchasePartyModel.js';
import sequelize from "../Config/db.js";



// add purchase service
export const createPurchaseService = async (data) => {
  const { items, userId, ...purchaseData } = data;

  return await sequelize.transaction(async (t) => {
    const purchase = await Purchase.create({
      ...purchaseData,
      userId,
    }, { transaction: t });

    const purchaseItems = items.map(item => ({
      ...item,
      purchaseId: purchase.id,
      userId,
    }));
    await PurchaseItem.bulkCreate(purchaseItems, { transaction: t });

    // Increase product stock
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        product.totalQuantity += item.quantity;
        await product.save({ transaction: t });
      }
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

    const oldItems = await PurchaseItem.findAll({
      where: { purchaseId: id },
      transaction: t
    });
    for (const old of oldItems) {
      const product = await Product.findByPk(old.productId, { transaction: t });
      if (product) {
        product.totalQuantity -= old.quantity;
        await product.save({ transaction: t });
      }
    }

    await PurchaseItem.destroy({ where: { purchaseId: id }, transaction: t });
    await purchase.update(purchaseDetails, { transaction: t });

    const newItems = items.map(item => ({
      ...item,
      purchaseId: id,
      userId,
    }));
    await PurchaseItem.bulkCreate(newItems, { transaction: t });

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        product.totalQuantity += item.quantity;
        await product.save({ transaction: t });
      }
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
      transaction: t
    });
    for (const item of purchaseItems) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        product.totalQuantity -= item.quantity;
        await product.save({ transaction: t });
      }
    }

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
        as: 'purchaseParty',
        attributes: ['id', 'name'],
      },
    ],
    order: [['id', 'DESC']],
  });
};


// get purchase by id
export const getPurchaseByIdService = async (id) => {
  return await Purchase.findByPk(id, {
    include: [
      { model: PurchaseItem },
      {
        model: PurchaseParty,
        as: 'purchaseParty',
        attributes: ['id', 'name'],
      },
    ],
  });
};


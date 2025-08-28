import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import Firm from '../Models/firmModel.js';
import Customer from '../Models/customerModel.js';





// Add a new purchase receipt
export const addPurchaseReceipt = async (data) => {
  try {
    // Save the receipt to the database
    return await PurchaseReceipt.create(data);
  } catch (error) {
    throw new Error("Error saving purchase receipt: " + error.message);
  }
};

// Get all purchase receipts for a user
export const getPurchaseReceipts = async (userId) => {
  try {
    return await PurchaseReceipt.findAll({
      where: { userId },
              include: [
      {
        model: Firm,
        as: 'firm',
        attributes: ['id', 'firmName'],
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name'],
      },
    ],
      order: [["createdAt", "DESC"]],
    });
  } catch (error) {
    throw new Error("Error fetching receipts: " + error.message);
  }
};

// Get a single purchase receipt by ID
export const getPurchaseReceiptById = async (id) => {
  try {
    return await PurchaseReceipt.findByPk(id);
  } catch (error) {
    throw new Error("Error fetching receipt: " + error.message);
  }
};

// Edit a purchase receipt
export const editPurchaseReceipt = async (id, data) => {
  try {
    const receipt = await PurchaseReceipt.findByPk(id);
    if (!receipt) return null;

    return await receipt.update(data);
  } catch (error) {
    throw new Error("Error updating receipt: " + error.message);
  }
};

// Delete a purchase receipt
export const deletePurchaseReceipt = async (id) => {
  try {
    const receipt = await PurchaseReceipt.findByPk(id);
    if (!receipt) return null;

    await receipt.destroy();
    return receipt;
  } catch (error) {
    throw new Error("Error deleting receipt: " + error.message);
  }
};

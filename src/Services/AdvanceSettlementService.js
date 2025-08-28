import AdvanceSettlement from "../Models/AdvanceSettlementModel.js";
import Receipt from "../Models/receiptModel.js";
import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import Firm from "../Models/firmModel.js";

// Create a new advance settlement
// export const createSettlement = async (data) => {
//   try {
//     const { billType, receiptId } = data;

//     let receipt;
//     if (billType === 'sale') {
//       receipt = await Receipt.findByPk(receiptId);
//     } else if (billType === 'purchase') {
//       receipt = await PurchaseReceipt.findByPk(receiptId);
//     }

//     if (!receipt) throw new Error('Receipt not found.');

//     const settlement = await AdvanceSettlement.create(data);
//     return settlement;
//   } catch (error) {
//     if (error.name === 'SequelizeValidationError') {
//       // Log detailed validation error messages here
//       console.error('Validation errors:', error.errors.map(e => e.message));
//     } else {
//       console.error('Error:', error);
//     }
//     throw new Error(`Error creating settlement: ${error.message}`);
//   }
// };
export const createSettlement = async (data) => {
  try {
    const { billType, receiptId } = data;

    let receipt;
    if (billType === 'sale') {
      receipt = await Receipt.findByPk(receiptId);
    } else if (billType === 'purchase') {
      receipt = await PurchaseReceipt.findByPk(receiptId);
    }

    if (!receipt) throw new Error('Receipt not found.');

    const settlement = await AdvanceSettlement.create(data);
    return settlement;
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => ({
        message: e.message,
        path: e.path,
        value: e.value,
      })));
    } else {
      console.error('Error:', error);
    }
    throw new Error(`Error creating settlement: ${error.message}`);
  }
};



// Get all advance settlements for a user
export const getSettlements = async (userId) => {
  try {
    return await AdvanceSettlement.findAll({
      where: { userId },
      include: [
        {
          model: Receipt,
          as: "saleReceipt",
          attributes: ["id", "receiptNumber"],
        },
        {
          model: PurchaseReceipt,
          as: "purchaseReceipt",
          attributes: ["id", "billNumber"],
        },
        {
          model: Firm,
          as: "firm",
          attributes: ["id", "firmName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  } catch (error) {
    throw new Error(`Error fetching settlements: ${error.message}`);
  }
};

// Update an existing advance settlement
export const updateSettlement = async (id, data) => {
  try {
    const settlement = await AdvanceSettlement.findByPk(id);

    if (!settlement) throw new Error("Settlement not found.");

    // Dynamically set the related model based on the billType
    const { billType, receiptId } = data;
    let receipt;
    if (billType === "sale") {
      receipt = await Receipt.findByPk(receiptId);
    } else if (billType === "purchase") {
      receipt = await PurchaseReceipt.findByPk(receiptId);
    }

    if (!receipt) throw new Error("Receipt not found.");

    // Update the settlement
    await settlement.update(data);
    return settlement;
  } catch (error) {
    throw new Error(`Error updating settlement: ${error.message}`);
  }
};

// Delete an existing advance settlement
export const deleteSettlement = async (id) => {
  try {
    const settlement = await AdvanceSettlement.findByPk(id);

    if (!settlement) {
      return false;
    }

    await settlement.destroy();
    return true;
  } catch (error) {
    throw new Error(`Error deleting settlement: ${error.message}`);
  }
};

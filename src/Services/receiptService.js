import Receipt from '../Models/receiptModel.js';
import Firm from '../Models/firmModel.js';
import Customer from '../Models/customerModel.js';




// Add new receipt
export const addReceipt = async (data) => {
  if (!data.receiptNumber) {
    throw new Error("Receipt number is required");
  }

  let receiptNumber = data.receiptNumber;
  let suffix = 1;

  // Loop to find unique receipt number if duplicate found
  while (await receiptNumberExists(receiptNumber)) {
    receiptNumber = `${data.receiptNumber}-${suffix}`;
    suffix++;

    if (suffix > 1000) {
      throw new Error("Unable to generate unique receipt number");
    }
  }

  data.receiptNumber = receiptNumber;

  return await Receipt.create(data);
};

// Edit an existing receipt
export const editReceipt = async (id, data) => {
  return await Receipt.update(data, { where: { id } });
};

// Get all receipts for a specific user
export const getAllReceiptsByUser = async (userId) => {
  return await Receipt.findAll({
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
    order: [['date', 'DESC']],
  });
};

// Get a single receipt by ID
export const getReceiptById = async (id) => {
  return await Receipt.findOne({ where: { id } });
};

// Delete receipt
export const deleteReceipt = async (id) => {
  return await Receipt.destroy({ where: { id } });
};


// Check if receipt number already exists
export const receiptNumberExists = async (receiptNumber) => {
  const count = await Receipt.count({ where: { receiptNumber } });
  return count > 0;
};

import Product from "../Models/productModel.js";
import { Return, ReturnItem } from "../Models/returnModel.js";
import { increaseStock } from "../Middleware/stockService.js";

// ➕ Add Return
export const addReturn = async (returnData, items) => {
  const transaction = await Return.sequelize.transaction();

  try {
    const returnBillNo = `RET-${returnData.invoiceNumber}`;
    const record = await Return.create({ ...returnData, returnBillNo }, { transaction });

    if (items?.length > 0) {
      for (const item of items) {
        // ✅ Use centralized function
        await increaseStock(item.productId, item.quantity, transaction);

        await ReturnItem.create(
          { ...item, returnId: record.id, userId: returnData.userId },
          { transaction }
        );
      }
    }

    await transaction.commit();
    return await Return.findByPk(record.id, {
      include: { model: ReturnItem, as: "items" },
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// 🧾 Get all Returns
export const getAllReturns = async (userId) => {
  return await Return.findAll({
    where: { userId },
    include: { model: ReturnItem, as: "items" },
    order: [["id", "DESC"]],
  });
};

// 🔍 Find Return by invoice
export const findReturnByInvoice = async (invoiceNumber, userId) => {
  return await Return.findOne({
    where: { invoiceNumber, userId },
    include: { model: ReturnItem, as: "items" },
  });
};

// 🗑️ Delete Return
export const deleteReturn = async (id) => {
  const record = await Return.findByPk(id);
  if (!record) return null;

  await ReturnItem.destroy({ where: { returnId: id } });
  await record.destroy();

  return record;
};

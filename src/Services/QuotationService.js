import sequelize from "../Config/db.js";
import Firm from "../Models/firmModel.js";
import Customer from "../Models/customerModel.js";
import Product from "../Models/productModel.js";
import { QuotationModel, QuotationModelItem } from "../Models/QuotationModel.js";

// ✅ Create Quotation
export const createQuotationService = async (data) => {
  const {
    firmId,
    quotationNumber,
    userId,
    products,
    transportationCharges = 0,
    ...rest
  } = data;

  let subtotal = 0;

  const quotationItems = products.map((item) => {
    const itemSubtotal = item.price * item.quantity - (item.discount || 0);
    const gstAmount = (itemSubtotal * (item.gst || 0)) / 100;
    const totalWithGst = itemSubtotal + gstAmount;

    subtotal += totalWithGst;

    return {
      quotationId: null, // to be added later
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
    const quotation = await QuotationModel.create(
      {
        quotationNumber,
        firmId,
        userId,
        transportationCharges,
        subtotal,
        grandTotal,
        ...rest,
      },
      { transaction: t }
    );

    quotationItems.forEach((item) => (item.quotationId = quotation.id));
    await QuotationModelItem.bulkCreate(quotationItems, { transaction: t });

    return quotation;
  });
};

// ✅ Get all quotations for a user
export const getAllQuotationsService = async (userId) => {
  return await QuotationModel.findAll({
    where: { userId },
    include: [
      {
        model: QuotationModelItem,
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

// ✅ Get a single quotation by ID
export const getQuotationByIdService = async (id) => {
  return await QuotationModel.findByPk(id, {
    include: [
      {
        model: QuotationModelItem,
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
  });
};

// ✅ Update quotation
export const updateQuotationService = async (id, data) => {
  const { products, userId, ...updatedData } = data;

  let subtotal = 0;

  const updatedItems = products.map((item) => {
    const itemSubtotal = item.price * item.quantity - (item.discount || 0);
    const gstAmount = (itemSubtotal * (item.gst || 0)) / 100;
    const totalWithGst = itemSubtotal + gstAmount;

    subtotal += totalWithGst;

    return {
      quotationId: id,
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

  const grandTotal = subtotal + parseFloat(data.transportationCharges || 0);

  return await sequelize.transaction(async (t) => {
    const quotation = await QuotationModel.findByPk(id);
    if (!quotation) throw new Error("Quotation not found.");

    await quotation.update(
      {
        ...updatedData,
        subtotal,
        grandTotal,
      },
      { transaction: t }
    );

    await QuotationModelItem.destroy({
      where: { quotationId: id },
      transaction: t,
    });

    await QuotationModelItem.bulkCreate(updatedItems, { transaction: t });

    return quotation;
  });
};

// ✅ Delete quotation
export const deleteQuotationService = async (id) => {
  return await sequelize.transaction(async (t) => {
    const quotation = await QuotationModel.findByPk(id, {
      include: [QuotationModelItem],
    });

    if (!quotation) {
      throw new Error("Quotation not found.");
    }

    await QuotationModelItem.destroy({
      where: { quotationId: id },
      transaction: t,
    });

    await QuotationModel.destroy({
      where: { id },
      transaction: t,
    });

    return { message: "Quotation deleted successfully." };
  });
};

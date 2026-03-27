import Product from "../Models/productModel.js";

/**
 * Base Unit conversion logic
 */
const convertToBaseUnit = (quantity, unit) => {
  const qty = Number(quantity);

  let baseQty;

  switch (unit) {
    case "KG":
      baseQty = qty * 1000; // grams
      break;

    case "LTR":
      baseQty = qty * 1000; // ml
      break;

    case "METER":
      baseQty = qty * 100; // cm
      break;

    case "INCH":
      baseQty = qty * 25.4; // mm
      break;

    case "PCS":
    case "SET":
    case "QTY":
    default:
      baseQty = qty;
  }

  // 🔒 FORCE INTEGER for DB safety
  return Math.round(baseQty);
};



/**
 * Check if enough stock is available for a product
 */
// export const checkStock = async (productId, quantity) => {
//   const product = await Product.findByPk(productId);
//   if (!product) throw new Error(`Product with ID ${productId} not found`);
//   if (product.qty < quantity)
//     throw new Error(`Not enough stock for product: ${product.productName}`);
//   return product;
// };
export const checkStock = async (productId, quantity, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);

  const baseQty = convertToBaseUnit(quantity, product.unit);

  if (product.qty < baseQty) {
    throw new Error(`Not enough stock for ${product.productName}`);
  }

  return { product, baseQty };
};


/**
 * Decrease stock quantity
 */
// export const decreaseStock = async (productId, quantity) => {
//   const product = await checkStock(productId, quantity);
//   product.qty -= quantity;
//   await product.save();
//   return product;
// };
export const decreaseStock = async (productId, quantity, transaction) => {
  const { product, baseQty } = await checkStock(productId, quantity, transaction);

  product.qty -= baseQty;
  product.totalQuantity = product.qty;
  await product.save({ transaction });

  return product;
};


/**
 * Increase stock quantity (used for returns or exchanges)
 */
// export const increaseStock = async (productId, quantity) => {
//   const product = await Product.findByPk(productId);
//   if (!product) throw new Error(`Product with ID ${productId} not found`);
//   product.qty += quantity;
//   await product.save();
//   return product;
// };
export const increaseStock = async (productId, quantity, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  if (!product) throw new Error(`Product with ID ${productId} not found`);

  const baseQty = convertToBaseUnit(quantity, product.unit);

  product.qty += baseQty;
  product.totalQuantity = product.qty;
  await product.save({ transaction });

  return product;
};


/**
 * Restore stock when a sell is edited or deleted
 * Adds back quantities from a list of sell items
 */
export const restoreStockAfterSellUpdate = async (sellItems) => {
  for (const item of sellItems) {
    await increaseStock(item.productId, item.quantity);
  }
};

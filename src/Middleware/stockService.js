import Product from "../Models/productModel.js";

/**
 * Check if enough stock is available for a product
 */
export const checkStock = async (productId, quantity) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error(`Product with ID ${productId} not found`);
  if (product.qty < quantity)
    throw new Error(`Not enough stock for product: ${product.productName}`);
  return product;
};

/**
 * Decrease stock quantity
 */
export const decreaseStock = async (productId, quantity) => {
  const product = await checkStock(productId, quantity);
  product.qty -= quantity;
  await product.save();
  return product;
};

/**
 * Increase stock quantity (used for returns or exchanges)
 */
export const increaseStock = async (productId, quantity) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error(`Product with ID ${productId} not found`);
  product.qty += quantity;
  await product.save();
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

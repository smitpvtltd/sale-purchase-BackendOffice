import Product from '../Models/productModel.js';
import { SellItem } from '../Models/sellModel.js'


export const createProduct = async (productData) => {
  return await Product.create(productData);
};

export const getAllProducts = async () => {
  return await Product.findAll({ order: [['id', 'DESC']] });
};

// Get products by userId
export const getProductsByUser = async (userId) => {
  return await Product.findAll({
    where: { userId },
    order: [['id', 'DESC']],
  });
};

export const getProductById = async (id) => {
  return await Product.findByPk(id);
};

export const updateProduct = async (id, updateData) => {
  const product = await getProductById(id);
  if (!product) return null;

  await product.update(updateData);
  return product;
};


export const deleteProduct = async (id) => {
  const product = await getProductById(id);
  if (!product) return null;

  // Delete related sell_items first to avoid FK constraint error
  await SellItem.destroy({ where: { productId: id } });

  // Now delete the product
  await product.destroy();
  return product;
};


import Product from '../Models/productModel.js';
import { SellItem } from '../Models/sellModel.js'
import { PurchaseItem } from '../Models/purchaseModel.js';
import SubCategory from '../Models/subcategoryModel.js';

// Generate next barcode like PRD-0001
export const generateNextBarcode = async () => {
  const lastProduct = await Product.findOne({
    order: [['id', 'DESC']]
  });

  let nextNumber = 1;

  if (lastProduct && lastProduct.barcode) {
    const match = lastProduct.barcode.match(/PRD-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `PRD-${String(nextNumber).padStart(4, '0')}`;
};

// add product 
export const createProduct = async (productData) => {

  const barcode = await generateNextBarcode();

  return await Product.create({
    ...productData,
    barcode
  });
};

// get all products
export const getAllProducts = async () => {
  return await Product.findAll({ order: [['id', 'DESC']] });
};

// Get products by userId
export const getProductsByUser = async (userId) => {
  return await Product.findAll({
    where: { userId },
    order: [['id', 'DESC']],
    include: [
      {
        model: SubCategory,
        as: 'subcategory',  // Alias as per your association
        attributes: ['subCatNm'], // Only include the name of the subcategory
      }
    ]
  });
};

// get product by id 
export const getProductById = async (id) => {
  return await Product.findByPk(id);
};

// update product
export const updateProduct = async (id, updateData) => {
  const product = await getProductById(id);
  if (!product) return null;

  await product.update(updateData);
  return product;
};


// delete product
  export const deleteProduct = async (id) => {
  const product = await getProductById(id);
  if (!product) return null;

  // Check if product exists in any purchase
  const purchaseItemCount = await PurchaseItem.count({ where: { productId: id } });
  if (purchaseItemCount > 0) {
    throw new Error("Cannot delete product because it exists in purchase records");
  }

  // Delete related SellItems if needed
  await SellItem.destroy({ where: { productId: id } });

  await product.destroy();
  return product;
};

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByUser
} from '../Services/productService.js';

export const addProduct = async (req, res) => {
  try {
    const {
      category,
      productName,
      price,
      productCode,
      hsnCode,
      gst,
      unit,
      description,
      userId 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const images = req.files?.map(file => file.filename);

    const product = await createProduct({
      category,
      productName,
      price,
      productCode,
      hsnCode,
      gst,
      unit,
      description,
      images,
      userId,
    });

    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


export const getProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required.' });
    }

    const products = await getProductsByUser(userId);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found.' });
    res.status(200).json({ message: 'Product deleted.', product: deleted });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const product = await updateProduct(id, updatedData);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    res.status(200).json({ message: 'Product updated successfully.', product });
  } catch (error) {
    console.error('Edit Product Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
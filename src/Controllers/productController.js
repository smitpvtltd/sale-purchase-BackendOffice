import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByUser,
  generateNextBarcode
} from '../Services/productService.js';

// Get next barcode preview
export const getNextBarcodePreview = async (req, res) => {
  try {
    const barcode = await generateNextBarcode();
    res.status(200).json({ barcode });
  } catch (error) {
    console.error("Barcode Preview Error:", error);
    res.status(500).json({ message: "Error generating barcode" });
  }
};

// add product 
export const addProduct = async (req, res) => {
  try {
    const {
      category,
      subCat,
      productName,
      price,
      offerPrice,
      // qty,
      hsnCode,
      company,
      unit,
      size,
      productCommission,
      userId 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const images = req.files?.map(file => file.filename);

    // Create product
    const product = await createProduct({
      category,
      subCat,
      productName,
      price,
      offerPrice,
      // qty,
      hsnCode,
      company,
      unit,
      size,
      productCommission,
      images,
      userId,
    });

    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// get all products for a user
export const getProducts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required.' });
    }

    const products = await getProductsByUser(userId);
    console.log('Fetched Products:', products); // Debug log
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// get single product 
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

// delete product 
export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found.' });

    res.status(200).json({ message: 'Product deleted.', product: deleted });
  } catch (error) {
    console.error('Delete Product Error:', error);
    // Send custom error message if deletion restricted
    if (error.message.includes("exists in purchase records")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

// edit product
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
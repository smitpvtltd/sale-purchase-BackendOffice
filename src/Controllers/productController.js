import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  findProductByNameAndSize,
  getProductsByUser,
  generateNextBarcode
} from '../Services/productService.js';
import {
  createTenantProduct,
  deleteTenantProduct,
  findTenantProductByNameAndSize,
  getNextTenantBarcode,
  getTenantProductById,
  getTenantProducts,
  isClientWorkspaceUser,
  updateTenantProduct,
} from "../Services/tenantDbService.js";

const ALPHA_SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

const normalizeSizeToken = (value) => String(value || "").trim().toUpperCase();

const expandSizeInput = (sizeInput) => {
  const rawSize = String(sizeInput || "").trim();

  if (!rawSize.includes("-")) {
    return [rawSize];
  }

  const [rawStart, rawEnd] = rawSize.split("-").map((part) => part.trim());
  const start = normalizeSizeToken(rawStart);
  const end = normalizeSizeToken(rawEnd);

  const startAlphaIndex = ALPHA_SIZE_ORDER.indexOf(start);
  const endAlphaIndex = ALPHA_SIZE_ORDER.indexOf(end);
  if (startAlphaIndex !== -1 && endAlphaIndex !== -1 && startAlphaIndex <= endAlphaIndex) {
    return ALPHA_SIZE_ORDER.slice(startAlphaIndex, endAlphaIndex + 1);
  }

  const startNumber = Number(rawStart);
  const endNumber = Number(rawEnd);
  if (!Number.isNaN(startNumber) && !Number.isNaN(endNumber) && startNumber <= endNumber) {
    const numericSizes = [];
    for (let value = startNumber; value <= endNumber; value += 2) {
      numericSizes.push(String(value));
    }
    return numericSizes;
  }

  return [rawSize];
};

const buildVariantBarcode = (baseBarcode, _sizeValue, index, totalCount) => {
  if (totalCount === 1) {
    return baseBarcode;
  }

  const match = String(baseBarcode).match(/^(.*?)(\d+)$/);
  if (!match) {
    return `${baseBarcode}${index}`;
  }

  const [, prefix, numericPart] = match;
  const startNumber = Number(numericPart);
  const nextNumber = startNumber + index;
  return `${prefix}${String(nextNumber).padStart(numericPart.length, "0")}`;
};

// Get next barcode preview
export const getNextBarcodePreview = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (userId && await isClientWorkspaceUser(userId)) {
      const barcode = await getNextTenantBarcode(userId);
      return res.status(200).json({ barcode });
    }
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
      hsnCode,
      unit,
      size,
      productCommission,
      barcode,
    } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const requiredFields = [
      ["category", category],
      ["subCat", subCat],
      ["productName", productName],
      ["size", size],
      ["hsnCode", hsnCode],
      ["productCommission", productCommission],
      ["unit", unit],
      ["barcode", barcode],
    ];

    const missingField = requiredFields.find(([, value]) =>
      value === undefined || value === null || value === "",
    );

    if (missingField) {
      return res.status(400).json({
        message: `${missingField[0]} is required.`,
      });
    }

    const images = req.files?.map(file => file.filename);
    const sizes = expandSizeInput(size);

    if (await isClientWorkspaceUser(userId)) {
      for (const sizeVariant of sizes) {
        const existingProduct = await findTenantProductByNameAndSize(
          userId,
          productName,
          sizeVariant,
        );

        if (existingProduct) {
          return res.status(409).json({
            message: `Product with name "${productName}" and size "${sizeVariant}" already exists.`,
          });
        }
      }

      const products = [];
      for (const [index, sizeVariant] of sizes.entries()) {
        const product = await createTenantProduct(userId, {
          category,
          subCat,
          productName,
          price: 0,
          offerPrice: 0,
          hsnCode,
          company: "",
          unit,
          size: sizeVariant,
          productCommission,
          barcode: buildVariantBarcode(barcode, sizeVariant, index, sizes.length),
          images,
          userId,
        });
        products.push(product);
      }

      return res.status(201).json({
        message:
          products.length > 1
            ? 'Products created successfully for all size variants.'
            : 'Product created successfully.',
        products,
      });
    }

    for (const sizeVariant of sizes) {
      const existingProduct = await findProductByNameAndSize(
        userId,
        productName,
        sizeVariant,
      );

      if (existingProduct) {
        return res.status(409).json({
          message: `Product with name "${productName}" and size "${sizeVariant}" already exists.`,
        });
      }
    }

    const products = [];
    for (const [index, sizeVariant] of sizes.entries()) {
      const product = await createProduct({
        category,
        subCat,
        productName,
        price: 0,
        offerPrice: 0,
        hsnCode,
        company: "",
        unit,
        size: sizeVariant,
        productCommission,
        barcode: buildVariantBarcode(barcode, sizeVariant, index, sizes.length),
        images,
        userId,
      });
      products.push(product);
    }

    res.status(201).json({
      message:
        products.length > 1
          ? 'Products created successfully for all size variants.'
          : 'Product created successfully.',
      products,
    });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// get all products for a user
export const getProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required.' });
    }

    const isClientUser = await isClientWorkspaceUser(userId);
    const products = isClientUser
      ? await getTenantProducts(userId)
      : await getProductsByUser(userId);
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
    const userId = req.user?.id || req.query.userId;
    const product =
      userId && await isClientWorkspaceUser(userId)
        ? await getTenantProductById(userId, id)
        : await getProductById(id);
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
    const userId = req.user?.id || req.query.userId;
    const deleted =
      userId && await isClientWorkspaceUser(userId)
        ? await deleteTenantProduct(userId, id)
        : await deleteProduct(id);
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

    const resolvedUserId = req.user?.id || updatedData.userId;
    const product =
      resolvedUserId && await isClientWorkspaceUser(resolvedUserId)
        ? await updateTenantProduct(resolvedUserId, id, updatedData)
        : await updateProduct(id, updatedData);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    res.status(200).json({ message: 'Product updated successfully.', product });
  } catch (error) {
    console.error('Edit Product Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

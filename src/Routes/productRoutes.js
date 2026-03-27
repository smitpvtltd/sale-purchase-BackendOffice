import express from "express";
import {
  addProduct,
  getProducts,
  getSingleProduct,
  editProduct,
  removeProduct,
  getNextBarcodePreview,
} from "../Controllers/productController.js";

import { uploadFor } from "../Middleware/uploadMiddleware.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

// Use upload middleware for 'product' folder
const productUpload = uploadFor("product");

router.get("/next-barcode", authenticateToken, getNextBarcodePreview);
router.post("/add", authenticateToken, productUpload.array("image", 5), addProduct);
router.get("/all", authenticateToken, getProducts);
router.get("/:id", authenticateToken, getSingleProduct);
router.delete("/delete/:id", authenticateToken, removeProduct);
router.put("/edit/:id", authenticateToken, editProduct);

export default router;

import express from "express";
import {
  addProduct,
  getProducts,
  getSingleProduct,
  editProduct,
  removeProduct,
} from "../Controllers/productController.js";

import { uploadFor } from "../Middleware/uploadMiddleware.js";

const router = express.Router();

// Use upload middleware for 'product' folder
const productUpload = uploadFor("product");

router.post("/add", productUpload.array("image", 5), addProduct);
router.get("/all", getProducts);
router.get("/:id", getSingleProduct);
router.delete("/delete/:id", removeProduct);
router.put("/edit/:id", editProduct);

export default router;

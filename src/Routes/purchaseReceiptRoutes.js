import express from "express";
import {
  addPurchaseReceipt,
  getPurchaseReceipts,
  getPurchaseReceiptById,
  editPurchaseReceipt,
  deletePurchaseReceipt,
} from "../Controllers/purchaseReceiptController.js";

const router = express.Router();

// Route to add a new purchase receipt
router.post("/add", addPurchaseReceipt);

// Route to get all purchase receipts for a user
router.get("/all", getPurchaseReceipts);

// Route to get a purchase receipt by ID
router.get("/:id", getPurchaseReceiptById);

// Route to edit a purchase receipt
router.put("/edit/:id", editPurchaseReceipt);

// Route to delete a purchase receipt
router.delete("/delete/:id", deletePurchaseReceipt);

export default router;

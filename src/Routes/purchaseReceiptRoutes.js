import express from "express";
import {
  addPurchaseReceipt,
  getPurchaseReceipts,
  getPurchaseReceiptById,
  editPurchaseReceipt,
  deletePurchaseReceipt,
  getLatestPurchaseReceiptNumberForFirm,
} from "../Controllers/purchaseReceiptController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

// Route to add a new purchase receipt
router.post("/add", authenticateToken, addPurchaseReceipt);

// Route to get all purchase receipts for a user
router.get("/all", authenticateToken, getPurchaseReceipts);

// Get latest purchase receipt number for a specific firm
router.get("/latest-receipt-number", authenticateToken, getLatestPurchaseReceiptNumberForFirm);

// Route to get a purchase receipt by ID
router.get("/:id", authenticateToken, getPurchaseReceiptById);

// Route to edit a purchase receipt
router.put("/edit/:id", authenticateToken, editPurchaseReceipt);

// Route to delete a purchase receipt
router.delete("/delete/:id", authenticateToken, deletePurchaseReceipt);

export default router;

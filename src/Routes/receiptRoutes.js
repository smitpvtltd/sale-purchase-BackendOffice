import express from 'express';
import {
  addReceipt,
  editReceipt,
  getAllReceipts,
  getReceiptById,
  deleteReceipt,
  getLatestReceiptNumberForFirm,
} from '../Controllers/receiptController.js';

const router = express.Router();

// Add receipt
router.post('/add', addReceipt);

// Edit receipt
router.put("/edit/:id", editReceipt);

// Get all receipts for a user
router.get('/all', getAllReceipts);

// Get latest receipt number for a specific firm
router.get('/latest-receipt-number', getLatestReceiptNumberForFirm);

// Get receipt by ID
router.get('/:id', getReceiptById);

// Delete receipt
router.delete("/delete/:id", deleteReceipt);

export default router;

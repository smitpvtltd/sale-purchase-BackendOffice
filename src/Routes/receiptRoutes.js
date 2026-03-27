import express from 'express';
import {
  addReceipt,
  editReceipt,
  getAllReceipts,
  getReceiptById,
  deleteReceipt,
  getLatestReceiptNumberForFirm,
} from '../Controllers/receiptController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();

// Add receipt
router.post('/add', authenticateToken, addReceipt);

// Edit receipt
router.put("/edit/:id", authenticateToken, editReceipt);

// Get all receipts for a user
router.get('/all', authenticateToken, getAllReceipts);

// Get latest receipt number for a specific firm
router.get('/latest-receipt-number', authenticateToken, getLatestReceiptNumberForFirm);

// Get receipt by ID
router.get('/:id', authenticateToken, getReceiptById);

// Delete receipt
router.delete("/delete/:id", authenticateToken, deleteReceipt);

export default router;

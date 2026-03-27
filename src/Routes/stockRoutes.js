import express from 'express';
import {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
  getNextRefNumber,
} from '../Controllers/stockController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();

router.get("/next-ref", authenticateToken, getNextRefNumber);
router.post("/add", authenticateToken, createStock);
router.get("/all", authenticateToken, getAllStocks);
router.get("/:id", authenticateToken, getStockById);
router.put("/edit/:id", authenticateToken, updateStock);
router.delete("/delete/:id", authenticateToken, deleteStock);

export default router;

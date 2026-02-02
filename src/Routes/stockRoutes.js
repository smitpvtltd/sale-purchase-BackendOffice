import express from 'express';
import {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
  getNextRefNumber
} from '../Controllers/stockController.js';

const router = express.Router();

router.get("/next-ref", getNextRefNumber); // ✅ route to get next refNumber
router.post("/add", createStock);
router.get("/all", getAllStocks);
router.get("/:id", getStockById);
router.put("/edit/:id", updateStock);
router.delete("/delete/:id", deleteStock);

export default router;

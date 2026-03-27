import express from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
} from "../Controllers/purchaseController.js";
import { Purchase } from "../Models/purchaseModel.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";



const router = express.Router();

router.post("/create-bill", authenticateToken, createPurchase);
router.get("/get-bill", authenticateToken, getAllPurchases);
router.get("/:id", authenticateToken, getPurchaseById);
router.put("/edit/:id", authenticateToken, updatePurchase);
router.delete("/delete/:id", authenticateToken, deletePurchase);

// Invoice uniqueness check
router.get("/check-invoice/:invoiceNumber", authenticateToken, async (req, res) => {
  const { invoiceNumber } = req.params;
  try {
    const existing = await Purchase.findOne({ where: { invoiceNumber } });
    res.json({ exists: !!existing });
  } catch (err) {
    console.error("Error checking invoice:", err);
    res.status(500).json({ message: "Server error checking invoice" });
  }
});

export default router;

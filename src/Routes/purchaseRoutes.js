import express from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
} from "../Controllers/purchaseController.js";
import { Purchase } from "../Models/purchaseModel.js";



const router = express.Router();

router.post("/create-bill", createPurchase);
router.get("/get-bill", getAllPurchases);
router.get("/:id", getPurchaseById);
router.put("/edit/:id", updatePurchase);
router.delete("/delete/:id", deletePurchase);

// Invoice uniqueness check
router.get("/check-invoice/:invoiceNumber", async (req, res) => {
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

import express from "express";
import {
  createPurchaseParty,
  getPurchaseParties,
  editPurchaseParty,
  removePurchaseParty,
} from "../Controllers/purchasePartyController.js";

const router = express.Router();

router.post("/add", createPurchaseParty);
router.get("/all", getPurchaseParties);
router.put("/edit/:id", editPurchaseParty);
router.delete("/delete/:id", removePurchaseParty);

export default router;

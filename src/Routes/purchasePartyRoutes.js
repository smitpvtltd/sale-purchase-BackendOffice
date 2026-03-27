import express from "express";
import {
  createPurchaseParty,
  getPurchaseParties,
  editPurchaseParty,
  removePurchaseParty,
} from "../Controllers/purchasePartyController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, createPurchaseParty);
router.get("/all", authenticateToken, getPurchaseParties);
router.put("/edit/:id", authenticateToken, editPurchaseParty);
router.delete("/delete/:id", authenticateToken, removePurchaseParty);

export default router;

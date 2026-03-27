import express from "express";
import { createSell, getSells, editSell, removeSell, getInvoicePreview, getSellController } from "../Controllers/sellController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, createSell);
router.get("/all", authenticateToken, getSells);
router.get("/get-bill", authenticateToken, getSells);

// Invoice preview route
router.get("/invoice/preview", authenticateToken, getInvoicePreview);

router.get("/:id", authenticateToken, getSellController);
router.put("/edit/:id", authenticateToken, editSell);
router.delete("/delete/:id", authenticateToken, removeSell);

export default router;

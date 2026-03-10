import express from "express";
import { createSell, getSells, editSell, removeSell, getInvoicePreview, getSellController, approvePayment } from "../Controllers/sellController.js";

const router = express.Router();

router.post("/add", createSell);
router.get("/all", getSells);
router.get("/:id", getSellController);
router.put("/edit/:id", editSell);
router.delete("/delete/:id", removeSell);
router.patch("/:id/approve-payment", approvePayment);



// Invoice preview route
router.get("/invoice/preview", getInvoicePreview);

export default router;

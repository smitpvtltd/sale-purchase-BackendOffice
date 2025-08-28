import express from "express";
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  previewQuotationNumber,
} from "../Controllers/QuotationController.js";

const router = express.Router();

// ✅ Preview next quotation number by prefix
router.get("/preview", previewQuotationNumber);

// ✅ Create a new quotation
router.post("/add", createQuotation);

// ✅ Get all quotations for a user
router.get("/all", getAllQuotations);

// ✅ Get a specific quotation by ID
router.get("/:id", getQuotationById);

// ✅ Update quotation by ID
router.put("/update/:id", updateQuotation);

// ✅ Delete quotation by ID
router.delete("/delete/:id", deleteQuotation);

export default router;

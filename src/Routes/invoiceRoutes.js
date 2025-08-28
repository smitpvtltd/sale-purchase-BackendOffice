import express from "express";
import { generateInvoiceNumber, previewInvoiceNumber } from "../Controllers/invoiceController.js";



const router = express.Router();

// Use to show invoice number on form load (no increment)
router.get("/preview", previewInvoiceNumber);

// Endpoint to generate invoice number
router.get("/generate", generateInvoiceNumber);

export default router;

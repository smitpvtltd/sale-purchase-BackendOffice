import { generateInvoiceNumberService, previewInvoiceNumberService } from "../Services/invoiceService.js";




export const previewInvoiceNumber = async (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix) {
      return res.status(400).json({ message: "Prefix is required" });
    }

    const invoiceNumber = await previewInvoiceNumberService(prefix);
    res.status(200).json({ invoiceNumber });
  } catch (error) {
    console.error("Preview Invoice Error:", error);
    res.status(500).json({ message: "Error generating preview invoice number" });
  }
};

// generate invoice number (increment + return)
export const generateInvoiceNumber = async (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix) {
      return res.status(400).json({ message: "Prefix is required" });
    }

    const invoiceNumber = await generateInvoiceNumberService(prefix);
    res.status(200).json({ invoiceNumber });
  } catch (error) {
    console.error("Invoice Generation Error:", error);
    res.status(500).json({ message: "Server error while generating invoice number." });
  }
};

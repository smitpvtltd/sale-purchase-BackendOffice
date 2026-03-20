import * as purchaseReceiptService from "../Services/purchaseReceiptServices.js";
import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import Firm from "../Models/firmModel.js";

// Add a new purchase receipt
export const addPurchaseReceipt = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const receiptData = req.body;
    const receipt = await purchaseReceiptService.addPurchaseReceipt(receiptData);

    return res.status(201).json({ message: "Purchase Receipt added successfully", receipt });
  } catch (error) {
    res.status(400).json({ message: error.message || "Error adding purchase receipt" });
  }
};

// Get all purchase receipts for a user
export const getPurchaseReceipts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const receipts = await purchaseReceiptService.getPurchaseReceipts(userId);
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchase receipts", error });
  }
};

// Get a single purchase receipt by ID
export const getPurchaseReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Receipt ID is required." });
    }

    const receipt = await purchaseReceiptService.getPurchaseReceiptById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchase receipt", error });
  }
};

// Edit a purchase receipt
export const editPurchaseReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId || !id) {
      return res.status(400).json({ message: "userId and receipt ID are required." });
    }

    const updatedReceipt = await purchaseReceiptService.editPurchaseReceipt(id, req.body);
    if (!updatedReceipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json({ message: "Receipt updated successfully", updatedReceipt });
  } catch (error) {
    res.status(500).json({ message: "Error editing purchase receipt", error });
  }
};

// Delete a purchase receipt
export const deletePurchaseReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Receipt ID is required." });
    }

    const deletedReceipt = await purchaseReceiptService.deletePurchaseReceipt(id);
    if (!deletedReceipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json({ message: "Receipt deleted successfully", deletedReceipt });
  } catch (error) {
    res.status(500).json({ message: "Error deleting purchase receipt", error });
  }
};

// Get latest purchase receipt number for a specific firm
export const getLatestPurchaseReceiptNumberForFirm = async (req, res) => {
  try {
    const { firmId } = req.query;

    if (!firmId) {
      return res.status(400).json({ message: "firmId is required." });
    }

    const firmIdNum = parseInt(firmId, 10);
    if (isNaN(firmIdNum)) {
      return res
        .status(400)
        .json({ message: "firmId must be a valid number." });
    }

    const firm = await Firm.findByPk(firmIdNum);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }

    const latestReceipt = await PurchaseReceipt.findOne({
      where: { firmId: firmIdNum },
      order: [["createdAt", "DESC"]],
    });

    let lastNumber = 0;

    if (
      latestReceipt &&
      latestReceipt.receiptNumber &&
      typeof latestReceipt.receiptNumber === "string"
    ) {
      const parts = latestReceipt.receiptNumber.split("-");
      const numPart = parts[parts.length - 1];
      lastNumber = parseInt(numPart, 10) || 0;
    }

    const prefix = firm.purchaseRefInitial?.trim() || "PREC";
    const nextNumber = lastNumber + 1;
    const nextReceiptNumber = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    return res.status(200).json({
      prefix,
      lastNumber,
      nextNumber,
      nextReceiptNumber,
    });
  } catch (error) {
    console.error("Error fetching latest purchase receipt number:", error);
    return res.status(500).json({
      message:
        error.message || "Error fetching latest purchase receipt number.",
      error: error.stack || error,
    });
  }
};

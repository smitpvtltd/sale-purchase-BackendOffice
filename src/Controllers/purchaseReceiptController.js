import * as purchaseReceiptService from "../Services/purchaseReceiptServices.js";

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
    res.status(500).json({ message: error.message || "Error adding purchase receipt" });
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

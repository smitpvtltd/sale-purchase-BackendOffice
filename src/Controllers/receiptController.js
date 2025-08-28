import * as receiptService from "../Services/receiptService.js";
import Receipt from "../Models/receiptModel.js";

// Add receipt
export const addReceipt = async (req, res) => {
  try {
    const data = req.body;

    if (!data.userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!data.receiptNumber) {
      return res.status(400).json({ message: "receiptNumber is required." });
    }

    const receipt = await receiptService.addReceipt(data);
    res.status(201).json({ message: "Receipt added successfully", receipt });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Error adding receipt", error });
  }
};

// Edit receipt
export const editReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedReceipt = await receiptService.editReceipt(id, data);
    if (updatedReceipt[0]) {
      res.status(200).json({ message: "Receipt updated successfully" });
    } else {
      res.status(404).json({ message: "Receipt not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating receipt", error });
  }
};

// Get all receipts for a user
export const getAllReceipts = async (req, res) => {
  try {
    const { userId } = req.query; // userId passed as a query parameter

    if (!userId) {
      return res
        .status(400)
        .json({ message: "userId query parameter is required." });
    }

    const receipts = await receiptService.getAllReceiptsByUser(userId);
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching receipts", error });
  }
};

// Get receipt by ID
export const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(id);
    if (receipt) {
      res.status(200).json(receipt);
    } else {
      res.status(404).json({ message: "Receipt not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching receipt", error });
  }
};

// Delete receipt
export const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await receiptService.deleteReceipt(id);
    if (deleted) {
      res.status(200).json({ message: "Receipt deleted successfully" });
    } else {
      res.status(404).json({ message: "Receipt not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting receipt", error });
  }
};

// Get latest receipt number for a specific firm
export const getLatestReceiptNumberForFirm = async (req, res) => {
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

    console.log("Fetching latest receipt for firmId:", firmIdNum);

    const latestReceipt = await Receipt.findOne({
      where: { firmId: firmIdNum },
      order: [["createdAt", "DESC"]],
    });

    console.log("Latest receipt found:", latestReceipt);
    console.log(
      "Latest receiptNumber:",
      latestReceipt ? latestReceipt.receiptNumber : "No receipt found"
    );

    let lastNumber = 0;

    if (
      latestReceipt &&
      latestReceipt.receiptNumber &&
      typeof latestReceipt.receiptNumber === "string"
    ) {
      const parts = latestReceipt.receiptNumber.split("-");
      const numPart = parts[parts.length - 1];
      lastNumber = parseInt(numPart, 10) || 0;
    } else {
      console.log(
        "No valid receiptNumber found or receiptNumber is null/empty"
      );
      lastNumber = 0;
    }

    return res.status(200).json({ lastNumber });
  } catch (error) {
    console.error("Error fetching latest receipt number:", error);
    return res.status(500).json({
      message: error.message || "Error fetching latest receipt number.",
      error: error.stack || error,
    });
  }
};

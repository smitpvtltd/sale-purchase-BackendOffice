import * as receiptService from "../Services/receiptService.js";
import Receipt from "../Models/receiptModel.js";
import Firm from "../Models/firmModel.js";
import { getTenantContext, isClientWorkspaceUser } from "../Services/tenantDbService.js";

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
      .status(400)
      .json({ message: error.message || "Error adding receipt" });
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
    const { userId } = req.query;
    const receipt = await receiptService.getReceiptById(id, userId);
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
    const { userId } = req.query;
    const deleted = await receiptService.deleteReceipt(id, userId);
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
    const { firmId, userId } = req.query;

    if (!firmId) {
      return res.status(400).json({ message: "firmId is required." });
    }

    const firmIdNum = parseInt(firmId, 10);
    if (isNaN(firmIdNum)) {
      return res
        .status(400)
        .json({ message: "firmId must be a valid number." });
    }

    const clientWorkspace = userId && await isClientWorkspaceUser(userId);
    const tenantContext = clientWorkspace ? await getTenantContext(userId) : null;
    const FirmModel = tenantContext?.TenantFirm || Firm;
    const ReceiptModel = tenantContext?.TenantReceipt || Receipt;

    const firm = await FirmModel.findByPk(firmIdNum);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }

    console.log(`Fetching latest receipt for firmId: ${firm}`);

    const latestReceipt = await ReceiptModel.findOne({
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
    } else {
      lastNumber = 0;
    }

    const prefix = firm.saleReceiptInitial?.trim() || "REC";
    const nextNumber = lastNumber + 1;
    const nextReceiptNumber = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    return res.status(200).json({
      prefix,
      lastNumber,
      nextNumber,
      nextReceiptNumber,
    });
  } catch (error) {
    console.error("Error fetching latest receipt number:", error);
    return res.status(500).json({
      message: error.message || "Error fetching latest receipt number.",
      error: error.stack || error,
    });
  }
};

import { Op } from "sequelize";
import FirmModel from "../Models/firmModel.js";
import {
  createQuotationService,
  getAllQuotationsService,
  getQuotationByIdService,
  updateQuotationService,
  deleteQuotationService,
} from "../Services/QuotationService.js";
import { QuotationModel } from "../Models/QuotationModel.js";



// ✅ Create Quotation
export const createQuotation = async (req, res) => {
  try {
    const { firmId, quotationNumber } = req.body;
    const userId = req.body.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const firm = await FirmModel.findByPk(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    const newQuotationData = {
      ...req.body,
      userId,
      quotationNumber,
    };

    const quotation = await createQuotationService(newQuotationData);

    res.status(201).json(quotation);
  } catch (error) {
    console.error("Quotation Create Error:", error);
    res.status(500).json({
      message: error.message || "Error creating quotation.",
    });
  }
};

// ✅ Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const quotations = await getAllQuotationsService(userId);
    res.status(200).json(quotations);
  } catch (err) {
    console.error("Get All Quotations Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await getQuotationByIdService(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res.status(200).json(quotation);
  } catch (err) {
    console.error("Get Quotation By ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    const quotationId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const updatedQuotation = await updateQuotationService(quotationId, {
      ...req.body,
      userId,
    });

    res.status(200).json(updatedQuotation);
  } catch (err) {
    console.error("Update Quotation Error:", err);
    res.status(500).json({
      message: err.message || "Failed to update quotation",
    });
  }
};

// ✅ Delete quotation
export const deleteQuotation = async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    const quotationId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const result = await deleteQuotationService(quotationId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Delete Quotation Error:", err);
    res.status(500).json({
      message: err.message || "Failed to delete quotation",
    });
  }
};

// ✅ Preview next quotation number by prefix
export const previewQuotationNumber = async (req, res) => {
  try {
    const prefix = req.query.prefix;
    if (!prefix) {
      return res.status(400).json({ message: "Prefix is required" });
    }

    const latestQuotation = await QuotationModel.findOne({
      where: {
        quotationNumber: {
          [Op.like]: `${prefix}-%`,
        },
      },
      order: [["id", "DESC"]],
    });

    let nextNumber = "001";
    if (latestQuotation?.quotationNumber) {
      const parts = latestQuotation.quotationNumber.split("-");
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = String(lastNumber + 1).padStart(3, "0");
      }
    }

    const newQuotationNumber = `${prefix}-${nextNumber}`;
    res.status(200).json({ quotationNumber: newQuotationNumber });
  } catch (error) {
    console.error("Preview Quotation Number Error:", error);
    res.status(500).json({
      message: "Failed to preview quotation number.",
    });
  }
};

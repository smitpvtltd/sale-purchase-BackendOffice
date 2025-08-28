import FirmModel from "../Models/firmModel.js";
import {
  DeliveryChallan as Challan,
  DeliveryChallanItem as ChallanItem,
} from "../Models/ChallanEntryModel.js";
import { Op } from "sequelize";
import {
  createChallanService,
  getAllChallansService,
  getChallanByIdService,
  updateChallanService,
  deleteChallanService,
} from "../Services/ChallanEntryService.js";

// ✅ Create Challan
export const createChallan = async (req, res) => {
  try {
    const { firmId, isGstApplicable, billNumber } = req.body;
    const userId = req.body.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const firm = await FirmModel.findByPk(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }

    const newChallanData = {
      ...req.body,
      userId,
      billNumber,
    };

    // THIS line calls createChallanService passing an object as data
    const challan = await createChallanService(newChallanData);

    res.status(201).json(challan);
  } catch (error) {
    console.error("Challan Create Error:", error);
    res.status(500).json({
      message: error.message || "Error creating challan entry.",
    });
  }
};

// ✅ Get all challans
export const getAllChallans = async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const challans = await getAllChallansService(userId);
    res.status(200).json(challans);
  } catch (err) {
    console.error("Get All Challans Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get challan by ID
export const getChallanById = async (req, res) => {
  try {
    const challan = await getChallanByIdService(req.params.id);
    if (!challan) {
      return res.status(404).json({ message: "Challan not found" });
    }
    res.status(200).json(challan);
  } catch (err) {
    console.error("Get Challan By ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update challan
export const updateChallan = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    const challanId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const updatedChallan = await updateChallanService(challanId, {
      ...req.body,
      userId,
    });

    res.status(200).json(updatedChallan);
  } catch (err) {
    console.error("Update Challan Error:", err);
    res.status(500).json({
      message: err.message || "Failed to update challan",
    });
  }
};

// ✅ Delete challan
export const deleteChallan = async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    const challanId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const result = await deleteChallanService(challanId, userId);
    res.status(200).json(result);
  } catch (err) {
    console.error("Delete Challan Error:", err);
    res.status(500).json({
      message: err.message || "Failed to delete challan",
    });
  }
};

// ✅ Preview next challan number by prefix
export const previewChallanNumber = async (req, res) => {
  try {
    const prefix = req.query.prefix;
    if (!prefix) {
      return res.status(400).json({ message: "Prefix is required" });
    }

    const latestChallan = await Challan.findOne({
      where: {
        billNumber: {
          [Op.like]: `${prefix}-%`,
        },
      },
      order: [["id", "DESC"]],
    });

    let nextNumber = "001";
    if (latestChallan?.billNumber) {
      const parts = latestChallan.billNumber.split("-");
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = String(lastNumber + 1).padStart(3, "0");
      }
    }

    const invoiceNumber = `${prefix}-${nextNumber}`;
    res.status(200).json({ invoiceNumber });
  } catch (error) {
    console.error("Preview Challan Number Error:", error);
    res.status(500).json({
      message: "Failed to preview challan number.",
    });
  }
};

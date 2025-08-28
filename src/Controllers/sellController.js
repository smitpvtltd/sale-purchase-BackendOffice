import FirmModel from "../Models/firmModel.js"; // ✅ Import Firm model
import { generateInvoiceNumberService } from "../Services/invoiceService.js";
import {
  createSellService,
  getAllSellsService,
  getSellByIdService
} from "../Services/sellService.js";


// add sell 
  export const createSell = async (req, res) => {
    try {
      const { firmId, gstApplicable } = req.body;
      const userId = req.body.userId || req.headers["x-user-id"];
      if (!userId) return res.status(400).json({ message: "Missing userId" });

      // ✅ Fetch firm data
      const firm = await FirmModel.findByPk(firmId);
      if (!firm) {
        return res.status(404).json({ message: "Firm not found" });
      }

      // ✅ Determine prefix
      let rawPrefix = gstApplicable
        ? firm.saleEntryInitialGST
        : firm.saleEntryInitialNoGST;

      // ✅ Handle invalid or missing prefix
      if (!rawPrefix || rawPrefix === "-") {
        rawPrefix = "INV"; // Fallback
      }

      // ✅ Generate invoice number using prefix
      const invoiceNumber = await generateInvoiceNumberService(rawPrefix);

      const newSellData = {
        ...req.body,
        userId,
        invoiceNumber,
      };

      const sell = await createSellService(newSellData);

      res.status(201).json(sell);
    } catch (error) {
      console.error("Sell Create Error:", error);

    // ✅ Send dynamic error message to frontend
    res.status(500).json({
      message: error.message || "Error creating sell entry.",
    });
    }
  };


// get all sells
  export const getAllSells = async (req, res) => {
    try {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ message: "Missing userId" });
      }

      const sells = await getAllSellsService(userId);  // <-- Pass userId here

      res.status(200).json(sells);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };


// get sale by id
export const getSellById = async (req, res) => {
  try {
    const sell = await getSellByIdService(req.params.id);
    if (!sell) return res.status(404).json({ message: "Sell not found" });
    res.status(200).json(sell);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



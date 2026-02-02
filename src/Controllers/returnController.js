import {
  addReturn,
  getAllReturns,
  findReturnByInvoice,
  deleteReturn,
} from "../Services/returnService.js";

export const createReturn = async (req, res) => {
  try {
    console.log("🧾 Received Return Data:", req.body);

    const {
      invoiceNumber,
      date,
      firmId,
      customerId,
      userId,
      employeeName,
      subtotal = 0,
      discount = 0,
      gst = 0,
      grandTotal = 0,
      totalReturnAmount = 0,
      paymentMethod,
      paymentStatus,
      items = [],
    } = req.body;

    if (!invoiceNumber || !date || !firmId || !customerId || !userId || !employeeName) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await findReturnByInvoice(invoiceNumber, userId);
    if (existing) {
      return res.status(409).json({ message: "Return already exists for this invoice." });
    }

    const returnData = {
      invoiceNumber,
      date,
      firmId,
      customerId,
      userId,
      employeeName,
      subtotal,
      discount,
      gst,
      grandTotal,
      totalReturnAmount,
      paymentMethod,
      paymentStatus,
    };

    const result = await addReturn(returnData, items);
    res.status(201).json({ message: "Return recorded successfully.", result });
  } catch (err) {
    console.error("Error creating return:", err);
    res.status(500).json({ message: err.message || "Server error." });
  }
};

export const getReturns = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const data = await getAllReturns(userId);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const removeReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteReturn(id);
    if (!deleted) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Deleted successfully.", deleted });
  } catch (err) {
    console.error("Error deleting return:", err);
    res.status(500).json({ message: "Server error." });
  }
};

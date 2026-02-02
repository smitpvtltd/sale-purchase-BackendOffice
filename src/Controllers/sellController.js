import {
  addSell,
  getAllSells,
  findSellByInvoice,
  updateSell,
  deleteSell,
  generateNextInvoiceNumber,
  getSellById,
} from "../Services/sellService.js";

// Create Sell
export const createSell = async (req, res) => {
  const {
    invoiceNumber,
    date,
    customerId,
    firmId,
    userId,
    gstApplicable,
    subtotal,
    overallDiscount,
    billDiscountType,
    igst,
    cgst,
    sgst,
    grandTotal,
    paymentMode,
    paymentStatus,
    payingAmount,
    balanceAmount,
    items,
    transactionId,
    onlinePaymentMethod = "NA",
    chequeNumber = 0, 
    chequeBankName = "NA", 
    chequeDate = "NA", 
  } = req.body;

  // ✅ Validation
  if (
    !invoiceNumber ||
    !date ||
    !customerId ||
    !firmId ||
    !userId ||
    !grandTotal ||
    !paymentMode ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ message: "Missing required fields or no items provided." });
  }

  try {
    // ✅ Check duplicate invoice
    const existing = await findSellByInvoice(invoiceNumber, userId);
    if (existing) {
      return res.status(409).json({ message: "Invoice already exists for this user." });
    }

    // ✅ Map frontend → DB fields
    const sellData = {
      invoiceNumber,
      date,
      customerId,
      firmId,
      userId,
      gstApplicable,
      totalAmount: subtotal,
      totalDiscount: overallDiscount,
      billDiscountType,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      totalGST: Number(igst) + Number(cgst) + Number(sgst),
      finalAmount: grandTotal,
      paymentMethod: paymentMode,
      paymentDetails: paymentStatus,
      payingAmount:
        payingAmount !== undefined && payingAmount !== null ? payingAmount : grandTotal,
      balanceAmount:
        balanceAmount !== undefined && balanceAmount !== null
          ? balanceAmount
          : grandTotal - (payingAmount ?? 0),
                  transactionId,
        onlinePaymentMethod,
        chequeNumber,
        chequeBankName,
        chequeDate,
    };

    // ✅ Call transactional addSell (in sellService)
    const sell = await addSell(sellData, items);

    res.status(201).json({ message: "Sell created successfully", sell });
  } catch (error) {
    console.error("❌ Error creating sell:", error.message);

    // ✅ If stock check failed (out of stock), show proper message
    if (error.message.includes("Not enough stock")) {
      return res.status(400).json({ message: error.message });
    }

    // ✅ Handle Sequelize or rollback error
    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: error.message });
    }

    // ✅ Default fallback
    res.status(500).json({ message: "Server error while creating sell." });
  }
};



// Get all sells (by userId)
export const getSells = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId is required." });

  try {
    const sells = await getAllSells(userId);
    res.status(200).json(sells);
  } catch (error) {
    console.error("Error fetching sells:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Edit Sell
export const editSell = async (req, res) => {
  const { id } = req.params;
  const {
    subtotal,
    overallDiscount,
    igst,
    cgst,
    sgst,
    grandTotal,
     paymentMethod,
     paymentDetails,
    payingAmount,   // NEW
    balanceAmount,  // NEW
    items,
    ...rest
  } = req.body;

  const sellData = {
    ...rest,
    totalAmount: subtotal,
    totalDiscount: overallDiscount,
    totalGST: Number(igst) + Number(cgst) + Number(sgst),
    finalAmount: grandTotal,
    paymentMethod,
    paymentDetails,
    payingAmount: payingAmount !== undefined && payingAmount !== null ? payingAmount : grandTotal,
    balanceAmount: balanceAmount !== undefined && balanceAmount !== null
      ? balanceAmount
      : grandTotal - (payingAmount ?? 0),

  };


  try {
    const updated = await updateSell(id, sellData, items);
    if (!updated) return res.status(404).json({ message: "Sell not found." });
    res.status(200).json({ message: "Sell updated.", sell: updated });
  } catch (error) {
    console.error("Error updating sell:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// Delete Sell
export const removeSell = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteSell(id);
    if (!deleted) return res.status(404).json({ message: "Sell not found." });
    res.status(200).json({ message: "Sell deleted.", sell: deleted });
  } catch (error) {
    console.error("Error deleting sell:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// New: Get invoice preview
export const getInvoicePreview = async (req, res) => {
  const { prefix, userId } = req.query;

  if (!prefix || !userId) return res.status(400).json({ message: "Missing prefix or userId" });

  try {
    const invoiceNumber = await generateNextInvoiceNumber(prefix, Number(userId));
    res.status(200).json({ invoiceNumber });
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single sell by ID
export const getSellController = async (req, res) => {
  try {
    const { id } = req.params;
    const sell = await getSellById(id);
    if (!sell) return res.status(404).json({ message: "Sell not found" });
    res.status(200).json(sell);
  } catch (err) {
    console.error("Error fetching sell:", err);
    res.status(500).json({ message: "Server error" });
  }
};

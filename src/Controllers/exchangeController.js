import {
  addExchange,
  getAllExchanges,
  findExchangeByInvoice,
  deleteExchange,
} from "../Services/exchangeService.js";
import { Exchange, ExchangeReturnItem, ExchangeGivenItem } from "../Models/exchangeModel.js";
import { safeLogAudit } from "../Services/auditLogService.js";
import {
  createTenantExchange,
  deleteTenantExchange,
  findTenantExchangeByInvoice,
  getTenantExchangeById,
  getTenantExchanges,
  isClientWorkspaceUser,
  updateTenantExchangePayment,
} from "../Services/tenantDbService.js";

const getExchangeAuditSnapshot = (exchange, returnedItems = [], givenItems = []) => ({
  id: exchange.id,
  invoiceNumber: exchange.invoiceNumber,
  exchangeBillNo: exchange.exchangeBillNo,
  date: exchange.date,
  firmId: exchange.firmId,
  customerId: exchange.customerId,
  userId: exchange.userId,
  employeeName: exchange.employeeName,
  difference: exchange.difference,
  differenceType: exchange.differenceType,
  subtotal: exchange.subtotal,
  billDiscount: exchange.billDiscount,
  billDiscountType: exchange.billDiscountType,
  returnTotal: exchange.returnTotal,
  gst: exchange.gst,
  grandTotal: exchange.grandTotal,
  payingAmount: exchange.payingAmount,
  paymentMethod: exchange.paymentMethod,
  paymentStatus: exchange.paymentStatus,
  returnedItems,
  givenItems,
});




// add entry for exchange
export const createExchange = async (req, res) => {
  try {
    const {
      invoiceNumber,
      date,
      firmId,
      customerId,
      userId,
      difference,
      differenceType,
      employeeName,
      subtotal = 0,
      billDiscount = 0,
      billDiscountType = "₹", // ✅ new
      returnTotal = 0, // ✅ new
      gst = 0,
      grandTotal = 0,
      paymentMethod,
      paymentStatus,
      returnedItems = [],
      givenItems = [],
    } = req.body;

    if (
      !invoiceNumber ||
      !date ||
      !firmId ||
      !customerId ||
      !userId ||
      !employeeName
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await (
      await isClientWorkspaceUser(userId)
        ? findTenantExchangeByInvoice(userId, invoiceNumber)
        : findExchangeByInvoice(invoiceNumber, userId)
    );
    if (existing) {
      return res
        .status(409)
        .json({ message: "Exchange already exists for this invoice." });
    }

    // Only save payment info if customer needs to pay
    let paymentInfo = {};
    if (difference > 0) {
      paymentInfo = {
        paymentMethod: paymentMethod || "Cash",
        paymentStatus: paymentStatus || "Not Paid",
      };
    } else {
      // No payment for refunds
      paymentInfo = {
        paymentMethod: null,
        paymentStatus: "Exchanged",
      };
    }

    const exchangeData = {
      invoiceNumber,
      date,
      firmId,
      customerId,
      userId,
      difference,
      differenceType,
      employeeName,
      subtotal,
      billDiscount,
      billDiscountType, // ✅ include here
      returnTotal, // ✅ include here
      gst,
      grandTotal,
      paymentMethod,
      paymentStatus,
      ...paymentInfo,
    };

    const result = await (
      await isClientWorkspaceUser(userId)
        ? createTenantExchange(userId, exchangeData, returnedItems, givenItems)
        : addExchange(exchangeData, returnedItems, givenItems)
    );

    res
      .status(201)
      .json({ message: "Exchange recorded successfully.", result });

    await safeLogAudit({
      module: "EXCHANGE",
      entityId: result.id,
      action: "CREATE",
      oldValue: null,
      newValue: getExchangeAuditSnapshot(result, returnedItems, givenItems),
      userId: result.userId,
      metadata: { firmId: result.firmId, invoiceNumber: result.invoiceNumber },
    });
  } catch (err) {
    console.error("Error creating exchange:", err);
    res.status(500).json({ message: err.message || "Server error." });
  }
};

// get all exchanges for a user
export const getExchanges = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const data = await (
      await isClientWorkspaceUser(userId)
        ? getTenantExchanges(userId)
        : getAllExchanges(userId)
    );
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching exchanges:", err);
    res.status(500).json({ message: "Server error." });
  }
};


// delete an exchange
export const removeExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;
    const deleted = await (
      userId && await isClientWorkspaceUser(userId)
        ? deleteTenantExchange(userId, id)
        : deleteExchange(id)
    );
    if (!deleted) return res.status(404).json({ message: "Record not found." });

    res.status(200).json({ message: "Deleted successfully.", deleted });

    await safeLogAudit({
      module: "EXCHANGE",
      entityId: deleted.id,
      action: "DELETE",
      oldValue: getExchangeAuditSnapshot(
        deleted,
        deleted.returnedItems || [],
        deleted.givenItems || [],
      ),
      newValue: null,
      userId: deleted.userId,
      metadata: { firmId: deleted.firmId, invoiceNumber: deleted.invoiceNumber },
    });
  } catch (err) {
    console.error("Error deleting exchange:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Update payment for an exchange
export const updateExchangePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payingAmount, paymentMethod } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (userId && await isClientWorkspaceUser(userId)) {
      const updatedExchange = await updateTenantExchangePayment(
        userId,
        id,
        payingAmount,
        paymentMethod,
      );

      if (!updatedExchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }

      const totalReturned = (updatedExchange.returnedItems || []).reduce(
        (sum, item) => sum + Number(item.total || 0),
        0,
      );
      const difference = Number(updatedExchange.grandTotal || 0) - totalReturned;

      return res.status(200).json({
        message: "Payment updated successfully",
        exchange: updatedExchange,
        remainingAmount: difference - Number(updatedExchange.payingAmount || 0),
      });
    }

    const exchange = await Exchange.findByPk(id, {
      include: [
        { model: ExchangeReturnItem, as: "returnedItems" },
        { model: ExchangeGivenItem, as: "givenItems" }
      ],
    });

    if (!exchange) return res.status(404).json({ message: "Exchange not found" });

    const previousExchange = exchange.toJSON();

    // Calculate difference
    const totalReturned = exchange.returnedItems.reduce((sum, item) => sum + item.total, 0);
    const totalGiven = exchange.grandTotal || 0;
    const difference = totalGiven - totalReturned;

    // Update cumulative payment
    const totalPaid = (exchange.payingAmount || 0) + (payingAmount || 0);
    const status = totalPaid >= difference ? "Paid" : "Advance";

    exchange.payingAmount = totalPaid;
    exchange.paymentMethod = paymentMethod || exchange.paymentMethod || "N/A";
    exchange.paymentStatus = status;

    await exchange.save();

    // Re-fetch updated exchange with all associated items
    const updatedExchange = await Exchange.findByPk(id, {
      include: [
        { model: ExchangeReturnItem, as: "returnedItems" },
        { model: ExchangeGivenItem, as: "givenItems" }
      ],
    });

    res.status(200).json({
      message: "Payment updated successfully",
      exchange: updatedExchange,
      remainingAmount: difference - totalPaid,
    });

    await safeLogAudit({
      module: "EXCHANGE",
      entityId: updatedExchange.id,
      action: "UPDATE",
      oldValue: getExchangeAuditSnapshot(
        previousExchange,
        previousExchange.returnedItems || [],
        previousExchange.givenItems || [],
      ),
      newValue: getExchangeAuditSnapshot(
        updatedExchange,
        updatedExchange.returnedItems || [],
        updatedExchange.givenItems || [],
      ),
      userId: updatedExchange.userId,
      metadata: {
        firmId: updatedExchange.firmId,
        invoiceNumber: updatedExchange.invoiceNumber,
        changeType: "payment_update",
      },
    });
  } catch (err) {
    console.error("Error updating payment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

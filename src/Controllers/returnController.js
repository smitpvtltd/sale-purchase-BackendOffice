import {
  addReturn,
  getAllReturns,
  findReturnByInvoice,
  deleteReturn,
} from "../Services/returnService.js";
import { getEligibleReturnSellBills } from "../Services/sellService.js";
import { safeLogAudit } from "../Services/auditLogService.js";
import {
  createTenantReturn,
  deleteTenantReturn,
  findTenantReturnByInvoice,
  getTenantEligibleReturnSellBills,
  getTenantReturns,
  isClientWorkspaceUser,
  resolveTenantRequestContext,
} from "../Services/tenantDbService.js";

const getReturnAuditSnapshot = (record, items = []) => ({
  id: record.id,
  invoiceNumber: record.invoiceNumber,
  returnBillNo: record.returnBillNo,
  date: record.date,
  firmId: record.firmId,
  customerId: record.customerId,
  userId: record.userId,
  employeeName: record.employeeName,
  subtotal: record.subtotal,
  discount: record.discount,
  gst: record.gst,
  grandTotal: record.grandTotal,
  totalReturnAmount: record.totalReturnAmount,
  paymentMethod: record.paymentMethod,
  paymentStatus: record.paymentStatus,
  items,
});

export const createReturn = async (req, res) => {
  try {
    console.log("🧾 Received Return Data:", req.body);

    const {
      invoiceNumber,
      date,
      firmId,
      customerId,
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
    const { tenantOwnerId } = resolveTenantRequestContext(req);

    if (!invoiceNumber || !date || !firmId || !customerId || !tenantOwnerId || !employeeName) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await (
      await isClientWorkspaceUser(tenantOwnerId)
        ? findTenantReturnByInvoice(tenantOwnerId, invoiceNumber)
        : findReturnByInvoice(invoiceNumber, tenantOwnerId)
    );
    if (existing) {
      return res.status(409).json({ message: "Return already exists for this invoice." });
    }

    const returnData = {
      invoiceNumber,
      date,
      firmId,
      customerId,
      userId: tenantOwnerId,
      employeeName,
      subtotal,
      discount,
      gst,
      grandTotal,
      totalReturnAmount,
      paymentMethod,
      paymentStatus,
    };

    const result = await (
      await isClientWorkspaceUser(tenantOwnerId)
        ? createTenantReturn(tenantOwnerId, returnData, items)
        : addReturn(returnData, items)
    );

    res.status(201).json({ message: "Return recorded successfully.", result });

    await safeLogAudit({
      module: "RETURN",
      entityId: result.id,
      action: "CREATE",
      oldValue: null,
      newValue: getReturnAuditSnapshot(result, items),
      userId: result.userId,
      metadata: { firmId: result.firmId, invoiceNumber: result.invoiceNumber },
    });
  } catch (err) {
    console.error("Error creating return:", err);
    res.status(500).json({ message: err.message || "Server error." });
  }
};

export const getReturns = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const userId = tenantOwnerId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const data = await (
      await isClientWorkspaceUser(userId)
        ? getTenantReturns(userId)
        : getAllReturns(userId)
    );
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching returns:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const getEligibleReturnBills = async (req, res) => {
  try {
    const { firmId } = req.query;
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const userId = tenantOwnerId;

    if (!userId) {
      return res.status(400).json({ message: "Authenticated user is required." });
    }

    if (!firmId) {
      return res.status(400).json({ message: "firmId is required." });
    }

    const data = await (
      await isClientWorkspaceUser(userId)
        ? getTenantEligibleReturnSellBills(userId, Number(firmId))
        : getEligibleReturnSellBills(userId, Number(firmId))
    );

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching eligible return bills:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

export const removeReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const userId = tenantOwnerId;
    const deleted = await (
      userId && await isClientWorkspaceUser(userId)
        ? deleteTenantReturn(userId, id)
        : deleteReturn(id)
    );
    if (!deleted) return res.status(404).json({ message: "Record not found." });

    res.status(200).json({ message: "Deleted successfully.", deleted });

    await safeLogAudit({
      module: "RETURN",
      entityId: deleted.id,
      action: "DELETE",
      oldValue: getReturnAuditSnapshot(deleted, deleted.items || []),
      newValue: null,
      userId: deleted.userId,
      metadata: { firmId: deleted.firmId, invoiceNumber: deleted.invoiceNumber },
    });
  } catch (err) {
    console.error("Error deleting return:", err);
    res.status(500).json({ message: "Server error." });
  }
};

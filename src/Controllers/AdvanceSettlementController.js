import {
  addAdvanceSettlement,
  getAllAdvanceSettlements,
  findSettlementById,
  findSettlementByNumber,
  updateAdvanceSettlementById,
  deleteAdvanceSettlementById,
  generateNextReceiptNumber,
  getPendingBillsForParty,
  allocateAdvanceSettlementById,
} from '../Services/AdvanceSettlementService.js';
import {
  createLedgerEntry,
} from '../Services/ledgerService.js';
import { safeLogAudit } from "../Services/auditLogService.js";
import Receipt from "../Models/receiptModel.js";
import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import Firm from "../Models/firmModel.js";
import { getTenantContext, isClientWorkspaceUser } from "../Services/tenantDbService.js";

const getNextPrefixedNumber = async ({
  firmId,
  prefixField,
  defaultPrefix,
  model,
  numberField,
  FirmModel = Firm,
}) => {
  const firm = await FirmModel.findByPk(firmId);
  if (!firm) {
    throw new Error("Firm not found.");
  }

  const latestRecord = await model.findOne({
    where: { firmId },
    order: [["createdAt", "DESC"]],
  });

  let lastNumber = 0;
  const currentValue = latestRecord?.[numberField];
  if (typeof currentValue === "string") {
    const parts = currentValue.split("-");
    const numPart = parts[parts.length - 1];
    lastNumber = parseInt(numPart, 10) || 0;
  }

  const prefix = firm[prefixField]?.trim() || defaultPrefix;
  const nextNumber = lastNumber + 1;
  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
};

const getSaleReceiptAuditSnapshot = (receipt) => ({
  id: receipt.id,
  date: receipt.date,
  receiptNumber: receipt.receiptNumber,
  billNumber: receipt.billNumber,
  settlementId: receipt.settlementId,
  firmId: receipt.firmId,
  customerId: receipt.customerId,
  totalAmount: receipt.totalAmount,
  paidAmount: receipt.paidAmount,
  netBalance: receipt.netBalance,
  narration: receipt.narration,
  paymentMode: receipt.paymentMode,
  payingAmount: receipt.payingAmount,
  balanceAmount: receipt.balanceAmount,
  transactionId: receipt.transactionId,
  bankName: receipt.bankName,
  chequeNumber: receipt.chequeNumber,
  chequeDate: receipt.chequeDate,
  onlinePaymentType: receipt.onlinePaymentType,
  userId: receipt.userId,
});

const getPurchaseReceiptAuditSnapshot = (receipt) => ({
  id: receipt.id,
  date: receipt.date,
  receiptNumber: receipt.receiptNumber,
  billNumber: receipt.billNumber,
  settlementId: receipt.settlementId,
  firmId: receipt.firmId,
  customerId: receipt.customerId,
  totalAmount: receipt.totalAmount,
  paidAmount: receipt.paidAmount,
  netBalance: receipt.netBalance,
  narration: receipt.narration,
  paymentMode: receipt.paymentMode,
  payingAmount: receipt.payingAmount,
  balanceAmount: receipt.balanceAmount,
  transactionId: receipt.transactionId,
  bankName: receipt.bankName,
  chequeNumber: receipt.chequeNumber,
  chequeDate: receipt.chequeDate,
  onlinePaymentType: receipt.onlinePaymentType,
  userId: receipt.userId,
});

const getAdvanceSettlementAuditSnapshot = (settlement) => ({
  id: settlement.id,
  date: settlement.date,
  settlementNumber: settlement.settlementNumber,
  firmId: settlement.firmId,
  partyType: settlement.partyType,
  partyId: settlement.partyId,
  advanceAmount: settlement.advanceAmount,
  appliedAmount: settlement.appliedAmount,
  unappliedAmount: settlement.unappliedAmount,
  settlementStatus: settlement.settlementStatus,
  userId: settlement.userId,
});

// Create
export const createAdvanceSettlement = async (req, res) => {
  const { date, settlementNumber, firmId, partyType, partyId, advanceAmount, userId } = req.body;

  if (
    !date ||
    !settlementNumber ||
    !firmId ||
    !partyType ||
    !partyId ||
    !advanceAmount ||
    !userId
  ) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!["customer", "purchase_party"].includes(partyType)) {
    return res.status(400).json({ message: "partyType must be customer or purchase_party." });
  }

  try {
    let resolvedSettlementNumber = settlementNumber;
    const existing = await findSettlementByNumber(settlementNumber, userId);
    if (existing) {
      resolvedSettlementNumber = await generateNextReceiptNumber(userId);
    }

    const settlement = await addAdvanceSettlement({
      date,
      settlementNumber: resolvedSettlementNumber,
      firmId,
      partyType,
      partyId,
      advanceAmount,
      userId,
    });

    res.status(201).json({
      message:
        resolvedSettlementNumber === settlementNumber
          ? 'Settlement created.'
          : `Settlement created. Number updated to ${resolvedSettlementNumber} because ${settlementNumber} already existed.`,
      settlement,
    });

    await safeLogAudit({
      module: "ADVANCE_SETTLEMENT",
      entityId: settlement.id,
      action: "CREATE",
      oldValue: null,
      newValue: getAdvanceSettlementAuditSnapshot(settlement),
      userId: settlement.userId,
      metadata: { firmId: settlement.firmId },
    });
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all for a user
export const getAdvanceSettlements = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  try {
    const settlements = await getAllAdvanceSettlements(userId);
    res.status(200).json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update existing by ID
export const updateAdvanceSettlement = async (req, res) => {
  const { id } = req.params;
  const { date, settlementNumber, firmId, partyType, partyId, advanceAmount, userId } = req.body;

  if (!date || !settlementNumber || !firmId || !partyType || !partyId || !advanceAmount) {
    return res.status(400).json({ message: 'All fields are required for update.' });
  }

  if (!["customer", "purchase_party"].includes(partyType)) {
    return res.status(400).json({ message: "partyType must be customer or purchase_party." });
  }

  try {
    const existing = await findSettlementById(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Settlement not found.' });
    }

    // Check for duplicate settlement number on update
    if (settlementNumber !== existing.settlementNumber) {
      const conflict = await findSettlementByNumber(settlementNumber, userId);
      if (conflict) {
        return res.status(409).json({ message: 'Settlement number already in use.' });
      }
    }

    if (Number(advanceAmount) < Number(existing.appliedAmount || 0)) {
      return res.status(400).json({
        message: "advanceAmount cannot be less than already applied amount.",
      });
    }

    const updated = await updateAdvanceSettlementById(id, {
      date,
      settlementNumber,
      firmId,
      partyType,
      partyId,
      advanceAmount,
      userId: existing.userId,
      unappliedAmount:
        Number(advanceAmount) - Number(existing.appliedAmount || 0),
      settlementStatus:
        Number(existing.appliedAmount || 0) === 0
          ? "unapplied"
          : Number(advanceAmount) === Number(existing.appliedAmount || 0)
            ? "applied"
            : "partial",
    });

    res.status(200).json({ message: 'Settlement updated.', settlement: updated });

    await safeLogAudit({
      module: "ADVANCE_SETTLEMENT",
      entityId: updated.id,
      action: "UPDATE",
      oldValue: getAdvanceSettlementAuditSnapshot(existing),
      newValue: getAdvanceSettlementAuditSnapshot(updated),
      userId: updated.userId,
      metadata: { firmId: updated.firmId },
    });
  } catch (error) {
    console.error('Error updating settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete by ID
export const deleteAdvanceSettlement = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const existing = await findSettlementById(id, userId);
    if (!existing) {
      return res.status(404).json({ message: 'Settlement not found.' });
    }

    await deleteAdvanceSettlementById(id, userId);

    res.status(200).json({ message: 'Settlement deleted.' });

    await safeLogAudit({
      module: "ADVANCE_SETTLEMENT",
      entityId: existing.id,
      action: "DELETE",
      oldValue: getAdvanceSettlementAuditSnapshot(existing),
      newValue: null,
      userId: existing.userId,
      metadata: { firmId: existing.firmId },
    });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getAdvanceSettlementById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const settlement = await findSettlementById(id, userId);
    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found." });
    }

    res.status(200).json(settlement);
  } catch (error) {
    console.error("Error fetching settlement:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getPendingBills = async (req, res) => {
  const { userId, firmId, partyType, partyId } = req.query;

  if (!userId || !firmId || !partyType || !partyId) {
    return res.status(400).json({
      message: "userId, firmId, partyType and partyId are required.",
    });
  }

  if (!["customer", "purchase_party"].includes(partyType)) {
    return res.status(400).json({ message: "Invalid partyType." });
  }

  try {
    const bills = await getPendingBillsForParty({
      userId,
      firmId,
      partyType,
      partyId,
    });

    res.status(200).json(bills);
  } catch (error) {
    console.error("Error fetching pending bills:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const allocateAdvanceSettlement = async (req, res) => {
  const { id } = req.params;
  const { userId, allocations } = req.body;

  if (!userId || !Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({
      message: "userId and allocations are required.",
    });
  }

  try {
    const result = await allocateAdvanceSettlementById({
      id,
      userId,
    allocations,
    });

    const clientWorkspace = await isClientWorkspaceUser(userId);
    const tenantContext = clientWorkspace ? await getTenantContext(userId) : null;
    const ReceiptModel = tenantContext?.TenantReceipt || Receipt;
    const PurchaseReceiptModel = tenantContext?.TenantPurchaseReceipt || PurchaseReceipt;
    const FirmModel = tenantContext?.TenantFirm || Firm;

    const receipts = [];

    for (const item of result.allocations) {
      if (item.billType === "sale") {
        const receiptNumber = await getNextPrefixedNumber({
          firmId: result.settlement.firmId,
          prefixField: "saleReceiptInitial",
          defaultPrefix: "REC",
          model: ReceiptModel,
          numberField: "receiptNumber",
          FirmModel,
        });

        const receipt = await ReceiptModel.create({
          date: result.settlement.date,
          receiptNumber,
          billNumber: item.bill.id,
          settlementId: result.settlement.id,
          firmId: result.settlement.firmId,
          customerId: result.settlement.partyId,
          totalAmount: Number(item.bill.finalAmount || 0),
          paidAmount: Number(item.amount),
          netBalance: Number(item.bill.balanceAmount || 0),
          narration: `Receipt created against sale bill ${item.bill.invoiceNumber} via advance settlement ${result.settlement.settlementNumber}`,
          paymentMode: "Advance Settlement",
          payingAmount: Number(item.amount),
          balanceAmount: Number(item.bill.balanceAmount || 0),
          transactionId: "",
          bankName: "",
          chequeNumber: "",
          chequeDate: null,
          onlinePaymentType: "",
          userId: result.settlement.userId,
        });

        await createLedgerEntry({
          entryDate: receipt.date,
          entryType: "sale_receipt",
          voucherNumber: receipt.receiptNumber,
          sourceType: "receipt",
          sourceId: receipt.id,
          firmId: receipt.firmId,
          userId: receipt.userId,
          partyType: "customer",
          partyId: receipt.customerId,
          amount: receipt.paidAmount,
          creditAmount: receipt.paidAmount,
          paymentMode: receipt.paymentMode,
          paymentStatus: "Received",
          narration: receipt.narration,
          metadata: {
            receiptNumber: receipt.receiptNumber,
            billNumber: item.bill.id,
            billInvoiceNumber: item.bill.invoiceNumber,
            totalAmount: item.bill.finalAmount,
            paidAmount: receipt.paidAmount,
            balanceAmount: item.bill.balanceAmount,
            settlementId: result.settlement.id,
            settlementNumber: result.settlement.settlementNumber,
            allocationId: item.allocation.id,
          },
        });

        await safeLogAudit({
          module: "SALE_RECEIPT",
          entityId: receipt.id,
          action: "CREATE",
          oldValue: null,
          newValue: getSaleReceiptAuditSnapshot(receipt),
          userId: receipt.userId,
          metadata: {
            receiptNumber: receipt.receiptNumber,
            firmId: receipt.firmId,
            billNumber: item.bill.id,
            settlementId: result.settlement.id,
          },
        });

        receipts.push({
          type: "sale_receipt",
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          billId: item.bill.id,
          billNumber: item.bill.invoiceNumber,
          amount: Number(item.amount),
        });
        continue;
      }

      const receiptNumber = await getNextPrefixedNumber({
        firmId: result.settlement.firmId,
        prefixField: "purchaseRefInitial",
        defaultPrefix: "PREC",
        model: PurchaseReceiptModel,
        numberField: "receiptNumber",
        FirmModel,
      });

      const purchaseReceipt = await PurchaseReceiptModel.create({
        date: result.settlement.date,
        receiptNumber,
        billNumber: item.bill.id,
        settlementId: result.settlement.id,
        firmId: result.settlement.firmId,
        customerId: result.settlement.partyId,
        totalAmount: Number(item.bill.totalAmount || 0),
        paidAmount: Number(item.amount),
        netBalance: Number(item.bill.balanceAmount || 0),
        narration: `Receipt created against purchase bill ${item.bill.invoiceNumber} via advance settlement ${result.settlement.settlementNumber}`,
        paymentMode: "Advance Settlement",
        payingAmount: Number(item.amount),
        balanceAmount: Number(item.bill.balanceAmount || 0),
        transactionId: "",
        bankName: "",
        chequeNumber: "",
        chequeDate: null,
        onlinePaymentType: "",
        userId: result.settlement.userId,
      });

      await createLedgerEntry({
        entryDate: purchaseReceipt.date,
        entryType: "purchase_receipt",
        voucherNumber: purchaseReceipt.receiptNumber,
        sourceType: "purchase_receipt",
        sourceId: purchaseReceipt.id,
        firmId: purchaseReceipt.firmId,
        userId: purchaseReceipt.userId,
        partyType: "purchase_party",
        partyId: purchaseReceipt.customerId,
        amount: purchaseReceipt.paidAmount,
        debitAmount: purchaseReceipt.paidAmount,
        paymentMode: purchaseReceipt.paymentMode,
        paymentStatus: "Paid Out",
        narration: purchaseReceipt.narration,
        metadata: {
          receiptNumber: purchaseReceipt.receiptNumber,
          billNumber: item.bill.id,
          billInvoiceNumber: item.bill.invoiceNumber,
          totalAmount: item.bill.totalAmount,
          paidAmount: purchaseReceipt.paidAmount,
          balanceAmount: item.bill.balanceAmount,
          settlementId: result.settlement.id,
          settlementNumber: result.settlement.settlementNumber,
          allocationId: item.allocation.id,
        },
      });

      await safeLogAudit({
        module: "PURCHASE_RECEIPT",
        entityId: purchaseReceipt.id,
        action: "CREATE",
        oldValue: null,
        newValue: getPurchaseReceiptAuditSnapshot(purchaseReceipt),
        userId: purchaseReceipt.userId,
        metadata: {
          receiptNumber: purchaseReceipt.receiptNumber,
          firmId: purchaseReceipt.firmId,
          billNumber: item.bill.id,
          settlementId: result.settlement.id,
        },
      });

      receipts.push({
        type: "purchase_receipt",
        id: purchaseReceipt.id,
        receiptNumber: purchaseReceipt.receiptNumber,
        billId: item.bill.id,
        billNumber: item.bill.invoiceNumber,
        amount: Number(item.amount),
      });
    }

    await safeLogAudit({
      module: "ADVANCE_SETTLEMENT",
      entityId: result.settlement.id,
      action: "UPDATE",
      oldValue: null,
      newValue: {
        id: result.settlement.id,
        appliedAmount: result.settlement.appliedAmount,
        unappliedAmount: result.settlement.unappliedAmount,
        settlementStatus: result.settlement.settlementStatus,
        allocations: result.allocations.map((item) => ({
          billType: item.billType,
          billId: item.bill.id,
          amount: item.amount,
        })),
      },
      userId,
      metadata: {
        settlementNumber: result.settlement.settlementNumber,
        allocationCount: result.allocations.length,
      },
    });

    res.status(200).json({
      message: "Settlement allocated successfully.",
      settlement: result.settlement,
      allocations: result.allocations.map((item) => ({
        id: item.allocation.id,
        billType: item.billType,
        billId: item.bill.id,
        billNumber: item.bill.invoiceNumber,
        amount: item.amount,
      })),
      receipts,
    });
  } catch (error) {
    console.error("Error allocating settlement:", error);
    res.status(400).json({ message: error.message || "Allocation failed." });
  }
};

// Get receipt number helper (if needed separately)
export const getReceiptNumber = async (req, res) => {
  const { type, userId } = req.query;

  if (!type || !userId) {
    return res.status(400).json({ message: 'Both type and userId are required.' });
  }

  try {
    const receiptNumber = await generateNextReceiptNumber(userId);
    res.status(200).json(receiptNumber);
  } catch (error) {
    console.error('Error generating receipt number:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

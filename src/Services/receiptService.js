import Receipt from '../Models/receiptModel.js';
import Firm from '../Models/firmModel.js';
import Customer from '../Models/customerModel.js';
import { Sell } from "../Models/sellModel.js";
import AdvanceSettlement from "../Models/AdvanceSettlementModel.js";
import AdvanceSettlementAllocation from "../Models/advanceSettlementAllocationModel.js";
import {
  createLedgerEntry,
  markLedgerEntryDeletedBySource,
  updateLedgerEntryBySource,
} from './ledgerService.js';
import { safeLogAudit } from "./auditLogService.js";

const getReceiptAuditSnapshot = (receipt) => ({
  id: receipt.id,
  date: receipt.date,
  receiptNumber: receipt.receiptNumber,
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




// Add new receipt
export const addReceipt = async (data) => {
  if (!data.receiptNumber) {
    throw new Error("Receipt number is required");
  }

  if (!data.billNumber) {
    throw new Error("billNumber is required");
  }

  let receiptNumber = data.receiptNumber;
  let suffix = 1;

  // Loop to find unique receipt number if duplicate found
  while (await receiptNumberExists(receiptNumber)) {
    receiptNumber = `${data.receiptNumber}-${suffix}`;
    suffix++;

    if (suffix > 1000) {
      throw new Error("Unable to generate unique receipt number");
    }
  }

  const transaction = await Receipt.sequelize.transaction();

  try {
    const bill = await Sell.findByPk(data.billNumber, { transaction, lock: transaction.LOCK.UPDATE });
    if (!bill) {
      throw new Error("Sale bill not found");
    }

    if (Number(data.customerId) !== Number(bill.customerId)) {
      throw new Error("Receipt customer does not match sale bill customer");
    }

    const remainingBalance = Number(
      bill.balanceAmount ?? Number(bill.finalAmount || 0) - Number(bill.payingAmount || 0),
    );
    const paymentAmount = Number(data.payingAmount ?? data.paidAmount ?? 0);
    const settlementId = data.settlementId ? Number(data.settlementId) : null;

    if (paymentAmount <= 0) {
      throw new Error("payingAmount must be greater than 0");
    }

    if (remainingBalance <= 0) {
      throw new Error("Bill is already fully paid.");
    }

    if (paymentAmount > remainingBalance) {
      throw new Error("Settlement amount cannot exceed bill remaining balance.");
    }

    let settlement = null;
    if (settlementId) {
      settlement = await AdvanceSettlement.findByPk(settlementId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!settlement) {
        throw new Error("Settlement not found");
      }

      if (
        settlement.partyType !== "customer" ||
        Number(settlement.partyId) !== Number(bill.customerId)
      ) {
        throw new Error("Settlement does not belong to this customer.");
      }

      const availableSettlementAmount = Number(settlement.unappliedAmount || 0);
      if (availableSettlementAmount <= 0) {
        throw new Error("No amount is remaining to settle for this advance settlement.");
      }

      if (paymentAmount > availableSettlementAmount) {
        throw new Error("Settlement amount cannot exceed available balance.");
      }
    }

    const updatedPaidAmount = Number(bill.payingAmount || 0) + paymentAmount;
    const updatedBalanceAmount = Math.max(
      0,
      Number(bill.finalAmount || 0) - updatedPaidAmount,
    );
    const updatedPaymentStatus =
      updatedBalanceAmount === 0
        ? "Paid"
        : bill.paymentDetails || data.paymentStatus || "Advance";

    data.receiptNumber = receiptNumber;
    const receipt = await Receipt.create(
      {
        ...data,
        receiptNumber,
        settlementId,
        totalAmount: Number(bill.finalAmount || 0),
        paidAmount: paymentAmount,
        payingAmount: paymentAmount,
        netBalance: updatedBalanceAmount,
        balanceAmount: updatedBalanceAmount,
      },
      { transaction },
    );

    if (settlement) {
      const updatedAppliedAmount =
        Number(settlement.appliedAmount || 0) + paymentAmount;
      const updatedUnappliedAmount = Math.max(
        0,
        Number(settlement.advanceAmount || 0) - updatedAppliedAmount,
      );
      const updatedSettlementStatus =
        updatedUnappliedAmount === 0
          ? "applied"
          : updatedAppliedAmount > 0
            ? "partial"
            : "unapplied";

      await settlement.update(
        {
          appliedAmount: updatedAppliedAmount,
          unappliedAmount: updatedUnappliedAmount,
          settlementStatus: updatedSettlementStatus,
        },
        { transaction },
      );

      await AdvanceSettlementAllocation.create(
        {
          settlementId: settlement.id,
          billType: "sale",
          billId: bill.id,
          amount: paymentAmount,
          userId: receipt.userId,
        },
        { transaction },
      );
    }

    await bill.update(
      {
        payingAmount: updatedPaidAmount,
        balanceAmount: updatedBalanceAmount,
        paymentDetails: updatedPaymentStatus,
        paymentMethod: data.paymentMode || bill.paymentMethod,
      },
      { transaction },
    );

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
      narration:
        data.narration || `Receipt created against sale bill ${bill.invoiceNumber}`,
      metadata: {
        receiptNumber: receipt.receiptNumber,
        billNumber: bill.id,
        billInvoiceNumber: bill.invoiceNumber,
        totalAmount: bill.finalAmount,
        paidAmount: receipt.paidAmount,
        balanceAmount: updatedBalanceAmount,
        transactionId: receipt.transactionId,
        settlementId,
      },
      transaction,
    });

    await transaction.commit();

    await safeLogAudit({
      module: "SALE_RECEIPT",
      entityId: receipt.id,
      action: "CREATE",
      oldValue: null,
      newValue: getReceiptAuditSnapshot(receipt),
      userId: receipt.userId,
      metadata: {
        receiptNumber: receipt.receiptNumber,
        firmId: receipt.firmId,
        billNumber: bill.id,
        settlementId,
      },
    });

    return receipt;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Edit an existing receipt
export const editReceipt = async (id, data) => {
  const receipt = await Receipt.findByPk(id);
  if (!receipt) {
    return [0];
  }

  const previousReceipt = receipt.toJSON();
  await receipt.update(data);

  await updateLedgerEntryBySource({
    sourceType: "receipt",
    sourceId: receipt.id,
    entryDate: receipt.date,
    entryType: "sale_receipt",
    voucherNumber: receipt.receiptNumber,
    firmId: receipt.firmId,
    userId: receipt.userId,
    partyType: "customer",
    partyId: receipt.customerId,
    amount: receipt.paidAmount,
    creditAmount: receipt.paidAmount,
    paymentMode: receipt.paymentMode,
    paymentStatus: "Received",
    narration: data.narration || `Receipt ${receipt.receiptNumber}`,
    metadata: {
      receiptNumber: receipt.receiptNumber,
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      balanceAmount: receipt.balanceAmount,
      transactionId: receipt.transactionId,
    },
  });

  await safeLogAudit({
    module: "SALE_RECEIPT",
    entityId: receipt.id,
    action: "UPDATE",
    oldValue: getReceiptAuditSnapshot(previousReceipt),
    newValue: getReceiptAuditSnapshot(receipt),
    userId: receipt.userId,
    metadata: { receiptNumber: receipt.receiptNumber, firmId: receipt.firmId },
  });

  return [1];
};

// Get all receipts for a specific user
export const getAllReceiptsByUser = async (userId) => {
  return await Receipt.findAll({
    where: { userId },
        include: [
      {
        model: Firm,
        as: 'firm',
        attributes: ['id', 'firmName'],
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name'],
      },
    ],
    order: [['date', 'DESC']],
  });
};

// Get a single receipt by ID
export const getReceiptById = async (id) => {
  return await Receipt.findOne({ where: { id } });
};

// Delete receipt
export const deleteReceipt = async (id) => {
  const receipt = await Receipt.findByPk(id);
  if (!receipt) {
    return 0;
  }

  await markLedgerEntryDeletedBySource({
    sourceType: "receipt",
    sourceId: receipt.id,
    narration: `Sale receipt deleted: ${receipt.receiptNumber}`,
  });

  await receipt.destroy();

  await safeLogAudit({
    module: "SALE_RECEIPT",
    entityId: receipt.id,
    action: "DELETE",
    oldValue: getReceiptAuditSnapshot(receipt),
    newValue: null,
    userId: receipt.userId,
    metadata: { receiptNumber: receipt.receiptNumber, firmId: receipt.firmId },
  });

  return 1;
};


// Check if receipt number already exists
export const receiptNumberExists = async (receiptNumber) => {
  const count = await Receipt.count({ where: { receiptNumber } });
  return count > 0;
};

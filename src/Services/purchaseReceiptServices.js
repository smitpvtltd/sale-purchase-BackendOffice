import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import { Purchase } from "../Models/purchaseModel.js";
import AdvanceSettlement from "../Models/AdvanceSettlementModel.js";
import AdvanceSettlementAllocation from "../Models/advanceSettlementAllocationModel.js";
import {
  createLedgerEntry,
  markLedgerEntryDeletedBySource,
  updateLedgerEntryBySource,
} from "./ledgerService.js";
import { safeLogAudit } from "./auditLogService.js";
import Firm from '../Models/firmModel.js';
import Customer from '../Models/customerModel.js';

const getPurchaseReceiptAuditSnapshot = (receipt) => ({
  id: receipt.id,
  date: receipt.date,
  receiptNumber: receipt.receiptNumber,
  billNumber: receipt.billNumber,
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





// Add a new purchase receipt
export const addPurchaseReceipt = async (data) => {
  try {
    if (!data.billNumber) {
      throw new Error("billNumber is required");
    }

    const transaction = await PurchaseReceipt.sequelize.transaction();

    try {
      const bill = await Purchase.findByPk(data.billNumber, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!bill) {
        throw new Error("Purchase bill not found");
      }

      const partyId = data.purchasePartyId ?? data.customerId;
      if (Number(partyId) !== Number(bill.purchasePartyId)) {
        throw new Error("Receipt purchase party does not match purchase bill");
      }

      const remainingBalance = Number(
        bill.balanceAmount ??
          Number(bill.totalAmount || 0) - Number(bill.payingAmount || 0),
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
          settlement.partyType !== "purchase_party" ||
          Number(settlement.partyId) !== Number(bill.purchasePartyId)
        ) {
          throw new Error("Settlement does not belong to this purchase party.");
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
        Number(bill.totalAmount || 0) - updatedPaidAmount,
      );
      const updatedPaymentStatus =
        updatedBalanceAmount === 0 ? "Paid" : bill.paymentStatus || "Advance";

      const receipt = await PurchaseReceipt.create(
        {
          ...data,
          customerId: partyId,
          settlementId,
          totalAmount: Number(bill.totalAmount || 0),
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
            billType: "purchase",
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
          paymentStatus: updatedPaymentStatus,
          paymentMethod: data.paymentMode || bill.paymentMethod,
        },
        { transaction },
      );

      await createLedgerEntry({
        entryDate: receipt.date,
        entryType: "purchase_receipt",
        voucherNumber: receipt.receiptNumber,
        sourceType: "purchase_receipt",
        sourceId: receipt.id,
        firmId: receipt.firmId,
        userId: receipt.userId,
        partyType: "purchase_party",
        partyId: receipt.customerId,
        amount: receipt.paidAmount,
        debitAmount: receipt.paidAmount,
        paymentMode: receipt.paymentMode,
        paymentStatus: "Paid Out",
        narration:
          data.narration ||
          `Receipt created against purchase bill ${bill.invoiceNumber}`,
        metadata: {
          receiptNumber: receipt.receiptNumber,
          billNumber: bill.id,
          billInvoiceNumber: bill.invoiceNumber,
          totalAmount: bill.totalAmount,
          paidAmount: receipt.paidAmount,
          balanceAmount: updatedBalanceAmount,
          transactionId: receipt.transactionId,
          settlementId,
        },
        transaction,
      });

      await transaction.commit();

      await safeLogAudit({
        module: "PURCHASE_RECEIPT",
        entityId: receipt.id,
        action: "CREATE",
        oldValue: null,
        newValue: getPurchaseReceiptAuditSnapshot(receipt),
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
  } catch (error) {
    throw new Error("Error saving purchase receipt: " + error.message);
  }
};

// Get all purchase receipts for a user
export const getPurchaseReceipts = async (userId) => {
  try {
    return await PurchaseReceipt.findAll({
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
      order: [["createdAt", "DESC"]],
    });
  } catch (error) {
    throw new Error("Error fetching receipts: " + error.message);
  }
};

// Get a single purchase receipt by ID
export const getPurchaseReceiptById = async (id) => {
  try {
    return await PurchaseReceipt.findByPk(id);
  } catch (error) {
    throw new Error("Error fetching receipt: " + error.message);
  }
};

// Edit a purchase receipt
export const editPurchaseReceipt = async (id, data) => {
  try {
    const receipt = await PurchaseReceipt.findByPk(id);
    if (!receipt) return null;

    const previousReceipt = receipt.toJSON();
    await receipt.update(data);

    await updateLedgerEntryBySource({
      sourceType: "purchase_receipt",
      sourceId: receipt.id,
      entryDate: receipt.date,
      entryType: "purchase_receipt",
      voucherNumber: receipt.receiptNumber,
      firmId: receipt.firmId,
      userId: receipt.userId,
      partyType: "purchase_party",
      partyId: receipt.customerId,
      amount: receipt.paidAmount,
      debitAmount: receipt.paidAmount,
      paymentMode: receipt.paymentMode,
      paymentStatus: "Paid Out",
      narration: data.narration || `Receipt ${receipt.receiptNumber}`,
      metadata: {
        receiptNumber: receipt.receiptNumber,
        billNumber: receipt.billNumber,
        totalAmount: receipt.totalAmount,
        paidAmount: receipt.paidAmount,
        balanceAmount: receipt.balanceAmount,
        transactionId: receipt.transactionId,
      },
    });

    await safeLogAudit({
      module: "PURCHASE_RECEIPT",
      entityId: receipt.id,
      action: "UPDATE",
      oldValue: getPurchaseReceiptAuditSnapshot(previousReceipt),
      newValue: getPurchaseReceiptAuditSnapshot(receipt),
      userId: receipt.userId,
      metadata: { receiptNumber: receipt.receiptNumber, firmId: receipt.firmId },
    });

    return receipt;
  } catch (error) {
    throw new Error("Error updating receipt: " + error.message);
  }
};

// Delete a purchase receipt
export const deletePurchaseReceipt = async (id) => {
  try {
    const receipt = await PurchaseReceipt.findByPk(id);
    if (!receipt) return null;

    await markLedgerEntryDeletedBySource({
      sourceType: "purchase_receipt",
      sourceId: receipt.id,
      narration: `Purchase receipt deleted: ${receipt.receiptNumber}`,
    });

    await receipt.destroy();

    await safeLogAudit({
      module: "PURCHASE_RECEIPT",
      entityId: receipt.id,
      action: "DELETE",
      oldValue: getPurchaseReceiptAuditSnapshot(receipt),
      newValue: null,
      userId: receipt.userId,
      metadata: { receiptNumber: receipt.receiptNumber, firmId: receipt.firmId },
    });

    return receipt;
  } catch (error) {
    throw new Error("Error deleting receipt: " + error.message);
  }
};

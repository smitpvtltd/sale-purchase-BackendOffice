import sequelize from "../Config/db.js";
import Ledger from "../Models/ledgerModel.js";
import { Sell } from "../Models/sellModel.js";
import Receipt from "../Models/receiptModel.js";
import { Purchase } from "../Models/purchaseModel.js";
import PurchaseReceipt from "../Models/purchaseReceiptModel.js";
import Expense from "../Models/expenseModel.js";
import { Return } from "../Models/returnModel.js";
import { Exchange } from "../Models/exchangeModel.js";
import AdvanceSettlement from "../Models/AdvanceSettlementModel.js";
import Customer from "../Models/customerModel.js";
import PurchaseParty from "../Models/purchasePartyModel.js";
import {
  getEntryTypeLabel,
  getLedgerAmounts,
  normalizePaymentStatus,
} from "../Services/ledgerService.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPurchaseAmount = (purchase, currentAmount = 0) => {
  const normalizedCurrentAmount = toNumber(currentAmount, 0);
  if (normalizedCurrentAmount > 0) {
    return normalizedCurrentAmount;
  }

  return toNumber(purchase?.totalAmount, 0);
};

const buildSellPayload = async (ledger, sell) => {
  const amount = toNumber(sell.finalAmount, toNumber(ledger.amount, 0));
  const amounts = getLedgerAmounts("sell", amount);

  return {
    entryDate: sell.date,
    voucherNumber: sell.invoiceNumber,
    firmId: sell.firmId,
    userId: sell.userId,
    partyType: "customer",
    partyId: sell.customerId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode: sell.paymentMethod,
    paymentStatus: normalizePaymentStatus({
      paymentStatus: sell.paymentDetails,
      amount: sell.payingAmount,
      balanceAmount: sell.balanceAmount,
    }),
    narration: `Sale created for invoice ${sell.invoiceNumber}`,
    metadata: {
      totalAmount: sell.totalAmount,
      totalDiscount: sell.totalDiscount,
      totalGST: sell.totalGST,
      finalAmount: sell.finalAmount,
      payingAmount: sell.payingAmount,
      balanceAmount: sell.balanceAmount,
    },
  };
};

const buildSaleReceiptPayload = async (ledger, receipt) => {
  const amount = toNumber(receipt.paidAmount, 0);
  const amounts = getLedgerAmounts("sale_receipt", amount);

  return {
    entryDate: receipt.date,
    voucherNumber: receipt.receiptNumber,
    firmId: receipt.firmId,
    userId: receipt.userId,
    partyType: "customer",
    partyId: receipt.customerId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode: receipt.paymentMode,
    paymentStatus: "Received",
    narration: ledger.narration || `Sale receipt ${receipt.receiptNumber}`,
    metadata: {
      receiptNumber: receipt.receiptNumber,
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      balanceAmount: receipt.balanceAmount,
      transactionId: receipt.transactionId,
    },
  };
};

const buildPurchasePayload = async (ledger, purchase) => {
  const amount = getPurchaseAmount(purchase, ledger.amount);

  const receiptRows = await PurchaseReceipt.findAll({
    where: { billNumber: purchase.id },
    order: [["createdAt", "DESC"]],
  });

  const totalPaid = receiptRows.reduce(
    (sum, row) => sum + toNumber(row.paidAmount, 0),
    0,
  );
  const balanceAmount = Math.max(0, amount - totalPaid);
  const latestReceipt = receiptRows[0] || null;
  const amounts = getLedgerAmounts("purchase", amount);

  return {
    entryDate: purchase.date,
    voucherNumber: purchase.invoiceNumber,
    firmId: purchase.firmId,
    userId: purchase.userId,
    partyType: "purchase_party",
    partyId: purchase.purchasePartyId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode: latestReceipt?.paymentMode || ledger.paymentMode || null,
    paymentStatus: normalizePaymentStatus({
      amount: totalPaid,
      balanceAmount,
    }),
    narration: `Purchase created for invoice ${purchase.invoiceNumber}`,
    metadata: {
      totalAmount: amount,
      totalDiscount: purchase.totalDiscount,
      totalGST: purchase.totalGST,
      paidAmount: totalPaid,
      balanceAmount,
    },
  };
};

const buildPurchaseReceiptPayload = async (ledger, receipt) => {
  const amount = toNumber(receipt.paidAmount, 0);
  const amounts = getLedgerAmounts("purchase_receipt", amount);

  return {
    entryDate: receipt.date,
    voucherNumber: receipt.receiptNumber,
    firmId: receipt.firmId,
    userId: receipt.userId,
    partyType: "purchase_party",
    partyId: receipt.customerId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode: receipt.paymentMode,
    paymentStatus: "Paid Out",
    narration: ledger.narration || `Purchase receipt ${receipt.receiptNumber}`,
    metadata: {
      receiptNumber: receipt.receiptNumber,
      billNumber: receipt.billNumber,
      totalAmount: receipt.totalAmount,
      paidAmount: receipt.paidAmount,
      balanceAmount: receipt.balanceAmount,
      transactionId: receipt.transactionId,
    },
  };
};

const buildExpensePayload = async (ledger, expense) => {
  const amount = toNumber(expense.amount, 0);
  const amounts = getLedgerAmounts("expense", amount);

  return {
    entryDate: expense.date,
    userId: expense.userId,
    partyType: "other",
    partyName: expense.toWhom,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentStatus: "Paid",
    narration: expense.reason,
    metadata: {
      expenseType: expense.expenseType,
      description: expense.description,
    },
  };
};

const buildReturnPayload = async (ledger, returnRow) => {
  const amount = toNumber(
    returnRow.totalReturnAmount || returnRow.grandTotal,
    toNumber(ledger.amount, 0),
  );
  const amounts = getLedgerAmounts("return", amount);

  return {
    entryDate: returnRow.date,
    voucherNumber: returnRow.returnBillNo,
    firmId: returnRow.firmId,
    userId: returnRow.userId,
    partyType: "customer",
    partyId: returnRow.customerId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentMode: returnRow.paymentMethod,
    paymentStatus: returnRow.paymentStatus || "Paid",
    narration: `Return recorded for invoice ${returnRow.invoiceNumber}`,
    metadata: {
      invoiceNumber: returnRow.invoiceNumber,
      subtotal: returnRow.subtotal,
      gst: returnRow.gst,
      grandTotal: returnRow.grandTotal,
      totalReturnAmount: returnRow.totalReturnAmount,
      paymentStatus: returnRow.paymentStatus,
    },
  };
};

const buildExchangePayload = async (ledger, exchange) => {
  const amount = Math.abs(toNumber(exchange.difference, 0));
  const debitAmount =
    exchange.differenceType === "Receivable" ? amount : 0;
  const creditAmount =
    exchange.differenceType === "Payable" ? amount : 0;

  return {
    entryDate: exchange.date,
    voucherNumber: exchange.exchangeBillNo,
    firmId: exchange.firmId,
    userId: exchange.userId,
    partyType: "customer",
    partyId: exchange.customerId,
    amount,
    debitAmount,
    creditAmount,
    paymentMode: exchange.paymentMethod,
    paymentStatus: exchange.paymentStatus,
    narration: `Exchange recorded for invoice ${exchange.invoiceNumber}`,
    metadata: {
      invoiceNumber: exchange.invoiceNumber,
      difference: exchange.difference,
      differenceType: exchange.differenceType,
      returnTotal: exchange.returnTotal,
      grandTotal: exchange.grandTotal,
      paymentStatus: exchange.paymentStatus,
    },
  };
};

const buildAdvanceSettlementPayload = async (ledger, settlement) => {
  const amount = toNumber(settlement.advanceAmount, 0);
  const amounts = getLedgerAmounts("advance_settlement", amount);

  return {
    entryDate: settlement.date,
    voucherNumber: settlement.settlementNumber,
    firmId: settlement.firmId,
    userId: settlement.userId,
    partyType: "other",
    partyId: settlement.partyId,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentStatus: "Paid",
    narration: `Advance settlement created: ${settlement.settlementNumber}`,
    metadata: {
      settlementNumber: settlement.settlementNumber,
      partyId: settlement.partyId,
    },
  };
};

const buildCustomerPayload = async (ledger, customer, entryType) => {
  const amounts = getLedgerAmounts(entryType, 0);

  return {
    userId: customer.userId,
    partyType: "customer",
    partyId: customer.id,
    partyName: customer.name,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentStatus: null,
    narration:
      entryType === "customer_added"
        ? `Customer added: ${customer.name}`
        : `Customer removed: ${customer.name}`,
    metadata: {
      mobile: customer.mobile,
      email: customer.email,
    },
  };
};

const buildPurchasePartyPayload = async (ledger, party, entryType) => {
  const amounts = getLedgerAmounts(entryType, 0);

  return {
    userId: party.userId,
    partyType: "purchase_party",
    partyId: party.id,
    partyName: party.name,
    amount: amounts.amount,
    debitAmount: amounts.debitAmount,
    creditAmount: amounts.creditAmount,
    paymentStatus: null,
    narration:
      entryType === "purchase_party_added"
        ? `Purchase party added: ${party.name}`
        : `Purchase party removed: ${party.name}`,
    metadata: {
      mobile: party.mobile,
      email: party.email,
      companyName: party.companyName,
    },
  };
};

const buildUpdatedLedgerFields = async (ledger) => {
  switch (ledger.entryType) {
    case "sell": {
      const sell = await Sell.findByPk(ledger.sourceId);
      return sell ? buildSellPayload(ledger, sell) : null;
    }
    case "sale_receipt": {
      const receipt = await Receipt.findByPk(ledger.sourceId);
      return receipt ? buildSaleReceiptPayload(ledger, receipt) : null;
    }
    case "purchase": {
      const purchase = await Purchase.findByPk(ledger.sourceId);
      return purchase ? buildPurchasePayload(ledger, purchase) : null;
    }
    case "purchase_receipt": {
      const receipt = await PurchaseReceipt.findByPk(ledger.sourceId);
      return receipt ? buildPurchaseReceiptPayload(ledger, receipt) : null;
    }
    case "expense": {
      const expense = await Expense.findByPk(ledger.sourceId);
      return expense ? buildExpensePayload(ledger, expense) : null;
    }
    case "return": {
      const returnRow = await Return.findByPk(ledger.sourceId);
      return returnRow ? buildReturnPayload(ledger, returnRow) : null;
    }
    case "exchange": {
      const exchange = await Exchange.findByPk(ledger.sourceId);
      return exchange ? buildExchangePayload(ledger, exchange) : null;
    }
    case "advance_settlement": {
      const settlement = await AdvanceSettlement.findByPk(ledger.sourceId);
      return settlement
        ? buildAdvanceSettlementPayload(ledger, settlement)
        : null;
    }
    case "customer_added":
    case "customer_removed": {
      const customer = await Customer.findByPk(ledger.sourceId, { paranoid: false });
      return customer ? buildCustomerPayload(ledger, customer, ledger.entryType) : null;
    }
    case "purchase_party_added":
    case "purchase_party_removed": {
      const party = await PurchaseParty.findByPk(ledger.sourceId, {
        paranoid: false,
      });
      return party
        ? buildPurchasePartyPayload(ledger, party, ledger.entryType)
        : null;
    }
    default:
      return null;
  }
};

const backfillLedgerDerivedFields = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    const ledgers = await Ledger.findAll({
      order: [["id", "ASC"]],
    });

    if (ledgers.length === 0) {
      console.log("No ledger rows found.");
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const ledger of ledgers) {
      const updatedFields = await buildUpdatedLedgerFields(ledger);

      if (!updatedFields) {
        skippedCount += 1;
        continue;
      }

      ledger.entryTypeLabel = getEntryTypeLabel(ledger.entryType);
      Object.assign(ledger, updatedFields);
      await ledger.save();
      updatedCount += 1;
    }

    console.log(`Updated ${updatedCount} ledger rows.`);
    console.log(`Skipped ${skippedCount} ledger rows with missing source data.`);
  } catch (error) {
    console.error("Error backfilling ledger derived fields:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

backfillLedgerDerivedFields();

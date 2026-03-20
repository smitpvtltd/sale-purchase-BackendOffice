import PurchaseParty from "../Models/purchasePartyModel.js";
import {
  createPurchaseService,
  getAllPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
  deletePurchaseService,
} from "../Services/purchaseService.js";
import {
  createLedgerEntry,
  markLedgerEntryDeletedBySource,
  normalizePaymentStatus,
  updateLedgerEntryBySource,
} from "../Services/ledgerService.js";
import { safeLogAudit } from "../Services/auditLogService.js";

const getPurchaseAuditSnapshot = (purchase) => ({
  id: purchase.id,
  invoiceNumber: purchase.invoiceNumber,
  date: purchase.date,
  purchasePartyId: purchase.purchasePartyId,
  firmId: purchase.firmId,
  userId: purchase.userId,
  totalAmount: purchase.totalAmount ?? purchase.grandTotal ?? null,
  totalDiscount: purchase.totalDiscount,
  totalGST: purchase.totalGST,
  paymentMode: purchase.paymentMode ?? purchase.paymentMethod ?? null,
  paymentStatus: purchase.paymentStatus ?? null,
  payingAmount: purchase.payingAmount ?? null,
  balanceAmount: purchase.balanceAmount ?? null,
  items: Array.isArray(purchase.PurchaseItems)
    ? purchase.PurchaseItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    : [],
});


export const createPurchase = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // Combine the userId with the incoming purchase data
    const party = await PurchaseParty.findByPk(req.body.purchasePartyId);
    if (!party) {
      return res.status(400).json({ message: "Invalid purchase party" });
    }

    // 🔐 GST NORMALIZATION
    const normalizedItems = req.body.items.map((item) => {
      if (party.stateType === "in_state") {
        return {
          ...item,
          igst: 0,
        };
      } else {
        return {
          ...item,
          cgst: 0,
          sgst: 0,
        };
      }
    });

    const newPurchaseData = {
      ...req.body,
      items: normalizedItems,
      payingAmount:
        req.body.payingAmount !== undefined && req.body.payingAmount !== null
          ? Number(req.body.payingAmount)
          : String(req.body.paymentStatus || "").trim().toLowerCase() === "paid"
            ? Number(req.body.grandTotal ?? req.body.totalAmount ?? req.body.subtotal ?? 0)
            : 0,
      balanceAmount:
        req.body.balanceAmount !== undefined && req.body.balanceAmount !== null
          ? Number(req.body.balanceAmount)
          : Number(req.body.grandTotal ?? req.body.totalAmount ?? req.body.subtotal ?? 0) -
            Number(
              req.body.payingAmount !== undefined && req.body.payingAmount !== null
                ? req.body.payingAmount
                : String(req.body.paymentStatus || "").trim().toLowerCase() === "paid"
                  ? req.body.grandTotal ?? req.body.totalAmount ?? req.body.subtotal ?? 0
                  : 0,
            ),
      userId,
    };

    // Call the service to create a new purchase and update the stock
    const purchase = await createPurchaseService(newPurchaseData);
    const totalAmount = Number(
      req.body.grandTotal ?? req.body.totalAmount ?? req.body.subtotal ?? 0,
    );

    await createLedgerEntry({
      entryDate: purchase.date,
      entryType: "purchase",
      voucherNumber: purchase.invoiceNumber,
      sourceType: "purchase",
      sourceId: purchase.id,
      firmId: purchase.firmId,
      userId: purchase.userId,
      partyType: "purchase_party",
      partyId: purchase.purchasePartyId,
      partyName: party.name,
      amount: totalAmount,
      paymentStatus: normalizePaymentStatus({
        paymentStatus: req.body.paymentStatus,
        amount: req.body.payingAmount ?? 0,
        balanceAmount: req.body.balanceAmount ?? totalAmount,
      }),
      narration: `Purchase created for invoice ${purchase.invoiceNumber}`,
      metadata: {
        totalAmount,
        totalDiscount: purchase.totalDiscount,
        totalGST: purchase.totalGST,
      },
    });

    // Return the created purchase
    res.status(201).json(purchase);

    await safeLogAudit({
      module: "PURCHASE",
      entityId: purchase.id,
      action: "CREATE",
      oldValue: null,
      newValue: getPurchaseAuditSnapshot(purchase),
      userId: purchase.userId,
      metadata: {
        invoiceNumber: purchase.invoiceNumber,
        firmId: purchase.firmId,
      },
    });
  } catch (error) {
    console.error("Purchase Create Error:", error);
    res.status(500).json({ message: "Error creating purchase." });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const { userId, firmId, purchasePartyId, pendingOnly } = req.query;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // Fetch all purchases for the user
    const purchases = await getAllPurchasesService(userId, {
      firmId,
      purchasePartyId,
      pendingOnly: String(pendingOnly || "").toLowerCase() === "true",
    });
    res.status(200).json(purchases);
  } catch (error) {
    console.error("Get Purchases Error:", error);
    res.status(500).json({ message: "Error fetching purchases." });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    // Fetch purchase by its ID
    const purchase = await getPurchaseByIdService(req.params.id);
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    // Return the found purchase
    res.status(200).json(purchase);
  } catch (error) {
    console.error("Get Purchase Error:", error);
    res.status(500).json({ message: "Error fetching purchase." });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // Call the service to update the purchase, passing along the userId
    const party = await PurchaseParty.findByPk(req.body.purchasePartyId);
    if (!party) {
      return res.status(400).json({ message: "Invalid purchase party" });
    }

    const normalizedItems = req.body.items.map((item) => {
      if (party.stateType === "in_state") {
        return {
          ...item,
          igst: 0,
        };
      } else {
        return {
          ...item,
          cgst: 0,
          sgst: 0,
        };
      }
    });

    const previousPurchase = await getPurchaseByIdService(req.params.id);
    if (!previousPurchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const purchase = await updatePurchaseService(req.params.id, {
      ...req.body,
      items: normalizedItems,
      userId,
    });

    const totalAmount = Number(
      req.body.grandTotal ?? req.body.totalAmount ?? req.body.subtotal ?? 0,
    );

    await updateLedgerEntryBySource({
      sourceType: "purchase",
      sourceId: purchase.id,
      entryDate: purchase.date,
      entryType: "purchase",
      voucherNumber: purchase.invoiceNumber,
      firmId: purchase.firmId,
      userId: purchase.userId,
      partyType: "purchase_party",
      partyId: purchase.purchasePartyId,
      partyName: party.name,
      amount: totalAmount,
      paymentStatus: normalizePaymentStatus({
        paymentStatus: req.body.paymentStatus,
        amount: req.body.payingAmount ?? 0,
        balanceAmount: req.body.balanceAmount ?? totalAmount,
      }),
      narration: `Purchase created for invoice ${purchase.invoiceNumber}`,
      metadata: {
        totalAmount,
        totalDiscount: purchase.totalDiscount,
        totalGST: purchase.totalGST,
      },
    });

    // Return the updated purchase
    res.status(200).json(purchase);

    const refreshedPurchase = await getPurchaseByIdService(req.params.id);
    await safeLogAudit({
      module: "PURCHASE",
      entityId: purchase.id,
      action: "UPDATE",
      oldValue: getPurchaseAuditSnapshot(previousPurchase),
      newValue: getPurchaseAuditSnapshot(refreshedPurchase || purchase),
      userId: purchase.userId,
      metadata: {
        invoiceNumber: purchase.invoiceNumber,
        firmId: purchase.firmId,
      },
    });
  } catch (error) {
    console.error("Update Purchase Error:", error);
    res.status(500).json({ message: "Error updating purchase." });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    // Call the service to delete the purchase and adjust stock accordingly
    const purchase = await getPurchaseByIdService(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const result = await deletePurchaseService(req.params.id);

    await markLedgerEntryDeletedBySource({
      sourceType: "purchase",
      sourceId: purchase.id,
      narration: `Purchase deleted for invoice ${purchase.invoiceNumber}`,
    });

    // Return a success message
    res.status(200).json(result);

    await safeLogAudit({
      module: "PURCHASE",
      entityId: purchase.id,
      action: "DELETE",
      oldValue: getPurchaseAuditSnapshot(purchase),
      newValue: null,
      userId: purchase.userId,
      metadata: {
        invoiceNumber: purchase.invoiceNumber,
        firmId: purchase.firmId,
      },
    });
  } catch (error) {
    console.error("Delete Purchase Error:", error);
    res.status(500).json({ message: "Error deleting purchase." });
  }
};

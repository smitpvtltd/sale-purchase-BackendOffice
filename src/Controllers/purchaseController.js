import PurchaseParty from "../Models/purchasePartyModel.js";
import {
  createPurchaseService,
  getAllPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
  deletePurchaseService,
} from "../Services/purchaseService.js";

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
      userId,
    };

    // Call the service to create a new purchase and update the stock
    const purchase = await createPurchaseService(newPurchaseData);

    // Return the created purchase
    res.status(201).json(purchase);
  } catch (error) {
    console.error("Purchase Create Error:", error);
    res.status(500).json({ message: "Error creating purchase." });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // Fetch all purchases for the user
    const purchases = await getAllPurchasesService(userId);
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

    const purchase = await updatePurchaseService(req.params.id, {
      ...req.body,
      items: normalizedItems,
      userId,
    });

    // Return the updated purchase
    res.status(200).json(purchase);
  } catch (error) {
    console.error("Update Purchase Error:", error);
    res.status(500).json({ message: "Error updating purchase." });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    // Call the service to delete the purchase and adjust stock accordingly
    const result = await deletePurchaseService(req.params.id);

    // Return a success message
    res.status(200).json(result);
  } catch (error) {
    console.error("Delete Purchase Error:", error);
    res.status(500).json({ message: "Error deleting purchase." });
  }
};

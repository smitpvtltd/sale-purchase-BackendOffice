import {
  createPurchaseService,
  getAllPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
  deletePurchaseService
} from "../Services/purchaseService.js";

export const createPurchase = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const newPurchaseData = { ...req.body, userId };
    const purchase = await createPurchaseService(newPurchaseData);
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

    const purchases = await getAllPurchasesService(userId);
    res.status(200).json(purchases);
  } catch (error) {
    console.error("Get Purchases Error:", error);
    res.status(500).json({ message: "Error fetching purchases." });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await getPurchaseByIdService(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
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

    const purchase = await updatePurchaseService(req.params.id, {
      ...req.body,
      userId
    });
    res.status(200).json(purchase);
  } catch (error) {
    console.error("Update Purchase Error:", error);
    res.status(500).json({ message: "Error updating purchase." });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const result = await deletePurchaseService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Delete Purchase Error:", error);
    res.status(500).json({ message: "Error deleting purchase." });
  }
};

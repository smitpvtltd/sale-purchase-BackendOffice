import {
  createPurchasePartyService,
  getAllPurchasePartiesService,
  updatePurchasePartyService,
  deletePurchasePartyService,
} from "../Services/purchasePartyService.js";

export const createPurchaseParty = async (req, res) => {
  const {
    name,
    email,
    mobile,
    address,
    state,
    city,
    gstNumber,
    companyName,
    stateType,
    userId,
  } = req.body;

  if (!name || !email || !mobile || !address || !state || !city || !stateType || !userId) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    const party = await createPurchasePartyService({
      name,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      companyName,
      stateType,
      userId,
    });

    res.status(201).json({ message: "Purchase party added.", party });
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getPurchaseParties = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    const parties = await getAllPurchasePartiesService(userId);
    res.status(200).json(parties);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const editPurchaseParty = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    mobile,
    address,
    state,
    city,
    gstNumber,
    companyName,
    stateType,
  } = req.body;

  if (!name || !email || !mobile || !address || !state || !city || !stateType) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    const updatedParty = await updatePurchasePartyService(id, {
      name,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      companyName,
      stateType,
    });

    if (!updatedParty) return res.status(404).json({ message: "Purchase party not found." });

    res.status(200).json({ message: "Purchase party updated.", party: updatedParty });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const removePurchaseParty = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedParty = await deletePurchasePartyService(id);
    if (!deletedParty) return res.status(404).json({ message: "Purchase party not found." });

    res.status(200).json({ message: "Purchase party deleted.", party: deletedParty });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

import {
  createPurchasePartyService,
  getAllPurchasePartiesService,
  updatePurchasePartyService,
  deletePurchasePartyService,
} from "../Services/purchasePartyService.js";
import { safeLogAudit } from "../Services/auditLogService.js";
import PurchaseParty from "../Models/purchasePartyModel.js";

const getPurchasePartyAuditSnapshot = (party) => ({
  id: party.id,
  name: party.name,
  email: party.email,
  mobile: party.mobile,
  address: party.address,
  state: party.state,
  city: party.city,
  gstNumber: party.gstNumber,
  companyName: party.companyName,
  stateType: party.stateType,
  userId: party.userId,
});

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

  if (!name || !email || !mobile || !stateType || !userId) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    const party = await createPurchasePartyService({
      name,
      email,
      mobile,
      address,
      state: state === "" ? null : state,
      city: city === "" ? null : city,
      gstNumber,
      companyName,
      stateType,
      userId,
    });

    res.status(201).json({ message: "Purchase party added.", party });

    await safeLogAudit({
      module: "PURCHASE_PARTY",
      entityId: party.id,
      action: "CREATE",
      oldValue: null,
      newValue: getPurchasePartyAuditSnapshot(party),
      userId: party.userId,
    });
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
    const previousParty = await PurchaseParty.findByPk(id);
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

    if (!updatedParty)
      return res.status(404).json({ message: "Purchase party not found." });

    res
      .status(200)
      .json({ message: "Purchase party updated.", party: updatedParty });

    await safeLogAudit({
      module: "PURCHASE_PARTY",
      entityId: updatedParty.id,
      action: "UPDATE",
      oldValue: previousParty ? getPurchasePartyAuditSnapshot(previousParty) : null,
      newValue: getPurchasePartyAuditSnapshot(updatedParty),
      userId: updatedParty.userId,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const removePurchaseParty = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedParty = await deletePurchasePartyService(id);
    if (!deletedParty)
      return res.status(404).json({ message: "Purchase party not found." });

    res
      .status(200)
      .json({ message: "Purchase party deleted.", party: deletedParty });

    await safeLogAudit({
      module: "PURCHASE_PARTY",
      entityId: deletedParty.id,
      action: "DELETE",
      oldValue: getPurchasePartyAuditSnapshot(deletedParty),
      newValue: null,
      userId: deletedParty.userId,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

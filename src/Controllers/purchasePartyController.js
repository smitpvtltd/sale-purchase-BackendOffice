import {
  createPurchasePartyService,
  getAllPurchasePartiesService,
  updatePurchasePartyService,
  deletePurchasePartyService,
} from "../Services/purchasePartyService.js";
import { safeLogAudit } from "../Services/auditLogService.js";
import PurchaseParty from "../Models/purchasePartyModel.js";
import {
  createTenantPurchaseParty,
  deleteTenantPurchaseParty,
  getTenantPurchaseParties,
  isClientWorkspaceUser,
  resolveTenantRequestContext,
  updateTenantPurchaseParty,
} from "../Services/tenantDbService.js";

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

const normalizeOptionalPurchasePartyFields = (data) => ({
  ...data,
  email: data.email === "" ? null : data.email,
  address: data.address === "" ? null : data.address,
  state: data.state === "" ? null : data.state,
  city: data.city === "" ? null : data.city,
  gstNumber: data.gstNumber === "" ? null : data.gstNumber,
  companyName: data.companyName === "" ? null : data.companyName,
  stateType: data.stateType === "" ? "in_state" : data.stateType || "in_state",
});

export const createPurchaseParty = async (req, res) => {
  const normalizedPayload = normalizeOptionalPurchasePartyFields(req.body);
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
  } = normalizedPayload;
  const { tenantOwnerId } = resolveTenantRequestContext(req);

  if (!name || !mobile || !tenantOwnerId) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    if (await isClientWorkspaceUser(tenantOwnerId)) {
      const party = await createTenantPurchaseParty(tenantOwnerId, {
        name,
        email,
        mobile,
        address,
        state,
        city,
        gstNumber,
        companyName,
        stateType,
        userId: tenantOwnerId,
      });
      return res.status(201).json({ message: "Purchase party added.", party });
    }

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
      userId: tenantOwnerId,
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
  const { tenantOwnerId } = resolveTenantRequestContext(req);

  if (!tenantOwnerId) {
    return res.status(400).json({ message: "userId is required." });
  }

  try {
    if (await isClientWorkspaceUser(tenantOwnerId)) {
      const parties = await getTenantPurchaseParties(tenantOwnerId);
      return res.status(200).json(parties);
    }

    const parties = await getAllPurchasePartiesService(tenantOwnerId);
    res.status(200).json(parties);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const editPurchaseParty = async (req, res) => {
  const { id } = req.params;
  const normalizedPayload = normalizeOptionalPurchasePartyFields(req.body);
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
  } = normalizedPayload;

  if (!name || !mobile) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);

    if (tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)) {
      const updatedParty = await updateTenantPurchaseParty(tenantOwnerId, id, {
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

      if (!updatedParty) {
        return res.status(404).json({ message: "Purchase party not found." });
      }

      return res
        .status(200)
        .json({ message: "Purchase party updated.", party: updatedParty });
    }

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
    const { tenantOwnerId } = resolveTenantRequestContext(req);

    if (tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)) {
      const deletedParty = await deleteTenantPurchaseParty(tenantOwnerId, id);
      if (!deletedParty) {
        return res.status(404).json({ message: "Purchase party not found." });
      }

      return res
        .status(200)
        .json({ message: "Purchase party deleted.", party: deletedParty });
    }

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

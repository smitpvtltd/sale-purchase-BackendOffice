import PurchaseParty from "../Models/purchasePartyModel.js";
import City from "../Models/cityModel.js";
import State from "../Models/stateModel.js";

export const createPurchasePartyService = async (data) => {
  return await PurchaseParty.create(data);
};

export const getAllPurchasePartiesService = async (userId) => {
  return await PurchaseParty.findAll({
    where: { userId },
    order: [["id", "ASC"]],
    include: [
      { model: State, attributes: ["id", "statename"] },
      { model: City, attributes: ["id", "citynm"] },
    ],
    attributes: [
      "id",
      "name",
      "email",
      "mobile",
      "address",
      "gstNumber",
      "companyName",
      "stateType",
    ],
  });
};

export const updatePurchasePartyService = async (id, data) => {
  const party = await PurchaseParty.findByPk(id);
  if (!party) return null;
  return await party.update(data);
};

export const deletePurchasePartyService = async (id) => {
  const party = await PurchaseParty.findByPk(id);
  if (!party) return null;
  await party.destroy();
  return party;
};

import Reason from "../Models/reasonModel.js";

export const createReason = async (reasonText, userId) => {
  return await Reason.create({ reason: reasonText, userId });
};

export const getAllReasons = async () => {
  return await Reason.findAll({ order: [["reason", "ASC"]] });
};
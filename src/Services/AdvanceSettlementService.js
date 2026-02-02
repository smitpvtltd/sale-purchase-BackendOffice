import AdvanceSettlement from '../Models/AdvanceSettlementModel.js';

export const addAdvanceSettlement = async (data) => {
  return await AdvanceSettlement.create(data);
};

export const getAllAdvanceSettlements = async (userId) => {
  return await AdvanceSettlement.findAll({
    where: { userId },
    order: [['date', 'DESC']],
  });
};

export const findSettlementByNumber = async (settlementNumber) => {
  return await AdvanceSettlement.findOne({ where: { settlementNumber } });
};

export const findSettlementById = async (id) => {
  return await AdvanceSettlement.findByPk(id);
};

export const updateAdvanceSettlementById = async (id, updateData) => {
  const settlement = await findSettlementById(id);
  if (!settlement) return null;

  Object.assign(settlement, updateData);
  await settlement.save();

  return settlement;
};

export const deleteAdvanceSettlementById = async (id) => {
  const settlement = await findSettlementById(id);
  if (!settlement) return null;

  await settlement.destroy();
  return settlement;
};

export const generateNextReceiptNumber = async () => {
  const settlements = await AdvanceSettlement.findAll({
    attributes: ['settlementNumber']
  });

  const numbers = settlements.map(s => {
    const match = s.settlementNumber.match(/SET-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  const maxNumber = numbers.length ? Math.max(...numbers) : 0;
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

  return `SET-${nextNumber}`;
};

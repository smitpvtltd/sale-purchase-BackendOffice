import AdvanceSettlement from '../Models/AdvanceSettlementModel.js';
import AdvanceSettlementAllocation from "../Models/advanceSettlementAllocationModel.js";
import { Sell } from "../Models/sellModel.js";
import { Purchase } from "../Models/purchaseModel.js";
import sequelize from "../Config/db.js";
import {
  addTenantAdvanceSettlement,
  findTenantSettlementById,
  findTenantSettlementByNumber,
  generateNextTenantSettlementNumber,
  getTenantContext,
  getTenantPendingBillsForParty,
  getTenantAdvanceSettlements,
  getTenantSellById,
  getTenantPurchaseById,
  isClientWorkspaceUser,
  updateTenantAdvanceSettlementById,
  deleteTenantAdvanceSettlementById,
} from "./tenantDbService.js";

const resolveSalePaymentStatus = (paidAmount, balanceAmount, currentStatus) => {
  const normalizedPaidAmount = Number(paidAmount || 0);
  const normalizedBalanceAmount = Number(balanceAmount || 0);

  if (normalizedBalanceAmount === 0 && normalizedPaidAmount > 0) {
    return "Paid";
  }

  if (normalizedPaidAmount > 0) {
    return "Advance";
  }

  return currentStatus || "Not Paid";
};

const getDerivedSettlementState = (settlement) => {
  const advanceAmount = Number(settlement.advanceAmount || 0);
  const allocations = Array.isArray(settlement.allocations) ? settlement.allocations : [];
  const appliedAmount = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.amount || 0),
    0,
  );
  const unappliedAmount = Math.max(0, advanceAmount - appliedAmount);
  const settlementStatus =
    unappliedAmount === 0
      ? "applied"
      : appliedAmount > 0
        ? "partial"
        : "unapplied";

  return {
    appliedAmount,
    unappliedAmount,
    settlementStatus,
  };
};

const settlementStateNeedsSync = (settlement, derivedState) =>
  Number(settlement.appliedAmount || 0) !== derivedState.appliedAmount ||
  Number(settlement.unappliedAmount || 0) !== derivedState.unappliedAmount ||
  settlement.settlementStatus !== derivedState.settlementStatus;

const syncSettlementState = async (settlement, options = {}) => {
  if (!settlement) return settlement;

  const derivedState = getDerivedSettlementState(settlement);
  const needsSync = settlementStateNeedsSync(settlement, derivedState);

  settlement.setDataValue("appliedAmount", derivedState.appliedAmount);
  settlement.setDataValue("unappliedAmount", derivedState.unappliedAmount);
  settlement.setDataValue("settlementStatus", derivedState.settlementStatus);

  if (needsSync) {
    await settlement.update(derivedState, options);
  }

  return settlement;
};

const getSettlementModels = async (userId) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    const context = await getTenantContext(userId);
    return {
      isTenant: true,
      sequelizeInstance: context.sequelize,
      AdvanceSettlementModel: context.TenantAdvanceSettlement,
      AllocationModel: context.TenantAdvanceSettlementAllocation,
      SellModel: context.TenantSell,
      PurchaseModel: context.TenantPurchase,
    };
  }

  return {
    isTenant: false,
    sequelizeInstance: sequelize,
    AdvanceSettlementModel: AdvanceSettlement,
    AllocationModel: AdvanceSettlementAllocation,
    SellModel: Sell,
    PurchaseModel: Purchase,
  };
};

export const addAdvanceSettlement = async (data) => {
  if (await isClientWorkspaceUser(data.userId)) {
    return addTenantAdvanceSettlement(data.userId, data);
  }

  return await AdvanceSettlement.create({
    ...data,
    appliedAmount: Number(data.appliedAmount || 0),
    unappliedAmount:
      data.unappliedAmount !== undefined && data.unappliedAmount !== null
        ? Number(data.unappliedAmount)
        : Number(data.advanceAmount || 0),
    settlementStatus: data.settlementStatus || "unapplied",
  });
};

export const getAllAdvanceSettlements = async (userId) => {
  if (await isClientWorkspaceUser(userId)) {
    const settlements = await getTenantAdvanceSettlements(userId);
    for (const settlement of settlements) {
      await syncSettlementState(settlement);
    }
    return settlements;
  }

  const settlements = await AdvanceSettlement.findAll({
    where: { userId },
    include: [{ model: AdvanceSettlementAllocation, as: "allocations" }],
    order: [['date', 'DESC']],
  });

  for (const settlement of settlements) {
    await syncSettlementState(settlement);
  }

  return settlements;
};

export const findSettlementByNumber = async (settlementNumber, userId = null) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    return findTenantSettlementByNumber(userId, settlementNumber);
  }

  return await AdvanceSettlement.findOne({ where: { settlementNumber } });
};

export const findSettlementById = async (id, userId = null) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    const settlement = await findTenantSettlementById(userId, id);
    if (!settlement) return null;
    await syncSettlementState(settlement);
    return settlement;
  }

  const settlement = await AdvanceSettlement.findByPk(id, {
    include: [{ model: AdvanceSettlementAllocation, as: "allocations" }],
  });

  if (!settlement) return null;

  await syncSettlementState(settlement);
  return settlement;
};

export const findSettlementByIdForUpdate = async (id, transaction) => {
  const settlement = await AdvanceSettlement.findByPk(id, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!settlement) return null;

  const allocations = await AdvanceSettlementAllocation.findAll({
    where: { settlementId: settlement.id },
    transaction,
    order: [["id", "ASC"]],
  });
  settlement.setDataValue("allocations", allocations);

  await syncSettlementState(settlement, { transaction });
  return settlement;
};

export const updateAdvanceSettlementById = async (id, updateData) => {
  if (updateData.userId && await isClientWorkspaceUser(updateData.userId)) {
    return updateTenantAdvanceSettlementById(updateData.userId, id, updateData);
  }

  const settlement = await findSettlementById(id);
  if (!settlement) return null;

  Object.assign(settlement, updateData);
  await settlement.save();

  return settlement;
};

export const deleteAdvanceSettlementById = async (id, userId = null) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    return deleteTenantAdvanceSettlementById(userId, id);
  }

  const settlement = await findSettlementById(id);
  if (!settlement) return null;

  await settlement.destroy();
  return settlement;
};

export const generateNextReceiptNumber = async (userId = null) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    return generateNextTenantSettlementNumber(userId);
  }

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

export const getPendingBillsForParty = async ({
  userId,
  firmId,
  partyType,
  partyId,
}) => {
  if (await isClientWorkspaceUser(userId)) {
    return getTenantPendingBillsForParty({
      userId,
      firmId,
      partyType,
      partyId,
    });
  }

  if (partyType === "customer") {
    const sells = await Sell.findAll({
      where: {
        userId,
        firmId,
        customerId: partyId,
      },
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    return sells
      .filter((bill) => Number(bill.balanceAmount || 0) > 0)
      .map((bill) => ({
        id: bill.id,
        invoiceNumber: bill.invoiceNumber,
        date: bill.date,
        totalAmount: bill.finalAmount,
        payingAmount: bill.payingAmount,
        balanceAmount: bill.balanceAmount,
        paymentStatus: bill.paymentDetails,
        billType: "sale",
      }));
  }

  const purchases = await Purchase.findAll({
    where: {
      userId,
      firmId,
      purchasePartyId: partyId,
    },
    order: [["date", "DESC"], ["id", "DESC"]],
  });

  return purchases
    .filter((bill) => Number(bill.balanceAmount || 0) > 0)
    .map((bill) => ({
      id: bill.id,
      invoiceNumber: bill.invoiceNumber,
      date: bill.date,
      totalAmount: bill.totalAmount,
      payingAmount: bill.payingAmount,
      balanceAmount: bill.balanceAmount,
      paymentStatus: bill.paymentStatus,
      billType: "purchase",
    }));
};

export const allocateAdvanceSettlementById = async ({
  id,
  userId,
  allocations,
}) => {
  const {
    sequelizeInstance,
    AdvanceSettlementModel,
    AllocationModel,
    SellModel,
    PurchaseModel,
  } = await getSettlementModels(userId);

  return sequelizeInstance.transaction(async (transaction) => {
    let settlement;

    if (await isClientWorkspaceUser(userId)) {
      settlement = await AdvanceSettlementModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!settlement) {
        throw new Error("Settlement not found");
      }

      const allocationsList = await AllocationModel.findAll({
        where: { settlementId: settlement.id },
        transaction,
        order: [["id", "ASC"]],
      });
      settlement.setDataValue("allocations", allocationsList);
      await syncSettlementState(settlement, { transaction });
    } else {
      settlement = await findSettlementByIdForUpdate(id, transaction);
    }

    if (!settlement) {
      throw new Error("Settlement not found");
    }

    if (Number(settlement.unappliedAmount || 0) <= 0) {
      throw new Error("No amount is remaining to settle for this advance settlement.");
    }

    const allocationItems = Array.isArray(allocations) ? allocations : [];
    if (allocationItems.length === 0) {
      throw new Error("At least one allocation is required");
    }

    const totalRequestedAllocation = allocationItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    if (totalRequestedAllocation <= 0) {
      throw new Error("Allocation amount must be greater than 0");
    }

    if (totalRequestedAllocation > Number(settlement.unappliedAmount || 0)) {
      throw new Error("Settlement amount cannot exceed available balance.");
    }

    const createdAllocations = [];

    for (const allocation of allocationItems) {
      const amount = Number(allocation.amount || 0);
      if (amount <= 0) {
        throw new Error("Each allocation amount must be greater than 0");
      }

      const billType = String(allocation.billType || "").toLowerCase();
      const billModel =
        billType === "sale" ? SellModel : billType === "purchase" ? PurchaseModel : null;

      if (!billModel) {
        throw new Error("Invalid billType");
      }

      const bill = await billModel.findByPk(allocation.billId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!bill) {
        throw new Error(`Bill not found for allocation ${allocation.billId}`);
      }

      if (
        (billType === "sale" &&
          (settlement.partyType !== "customer" ||
            Number(bill.customerId) !== Number(settlement.partyId))) ||
        (billType === "purchase" &&
          (settlement.partyType !== "purchase_party" ||
            Number(bill.purchasePartyId) !== Number(settlement.partyId)))
      ) {
        throw new Error("Allocation bill does not belong to selected party");
      }

      const billTotalAmount =
        billType === "sale"
          ? Number(bill.finalAmount || 0)
          : Number(bill.totalAmount || 0);
      const currentPaidAmount = Number(bill.payingAmount || 0);
      const currentBalanceAmount = Number(
        bill.balanceAmount ?? billTotalAmount - currentPaidAmount,
      );

      if (currentBalanceAmount <= 0) {
        throw new Error("Bill is already fully paid.");
      }

      if (amount > currentBalanceAmount) {
        throw new Error("Settlement amount cannot exceed bill remaining balance.");
      }

      const updatedPaidAmount = currentPaidAmount + amount;
      const updatedBalanceAmount = Math.max(0, billTotalAmount - updatedPaidAmount);
      const updatedPaymentStatus =
        billType === "sale"
          ? resolveSalePaymentStatus(
              updatedPaidAmount,
              updatedBalanceAmount,
              bill.paymentDetails,
            )
          : updatedBalanceAmount === 0
            ? "Paid"
            : updatedPaidAmount > 0
              ? "Advance"
              : bill.paymentStatus || "Not Paid";

      await bill.update(
        billType === "sale"
          ? {
              payingAmount: updatedPaidAmount,
              balanceAmount: updatedBalanceAmount,
              paymentDetails: updatedPaymentStatus,
            }
          : {
              payingAmount: updatedPaidAmount,
              balanceAmount: updatedBalanceAmount,
              paymentStatus: updatedPaymentStatus,
            },
        { transaction },
      );

      const createdAllocation = await AllocationModel.create(
        {
          settlementId: settlement.id,
          billType,
          billId: bill.id,
          amount,
          userId,
        },
        { transaction },
      );

      createdAllocations.push({
        allocation: createdAllocation,
        bill,
        billType,
        amount,
      });
    }

    const appliedAmount =
      Number(settlement.appliedAmount || 0) + totalRequestedAllocation;
    const unappliedAmount = Math.max(
      0,
      Number(settlement.advanceAmount || 0) - appliedAmount,
    );
    const settlementStatus =
      unappliedAmount === 0
        ? "applied"
        : appliedAmount > 0
          ? "partial"
          : "unapplied";

    await settlement.update(
      {
        appliedAmount,
        unappliedAmount,
        settlementStatus,
      },
      { transaction },
    );

    return {
      settlement,
      allocations: createdAllocations,
    };
  });
};

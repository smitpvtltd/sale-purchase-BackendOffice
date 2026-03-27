import { Sell } from "../Models/sellModel.js";
import { Purchase } from "../Models/purchaseModel.js";
import { Return } from "../Models/returnModel.js";
import Product from "../Models/productModel.js";
import Firm from "../Models/firmModel.js";
import {
  getTenantContext,
  isClientWorkspaceUser,
  resolveTenantRequestContext,
} from "../Services/tenantDbService.js";

const toNumber = (value) => Number(value || 0);

const buildBreakdown = ({ sales, purchases, returns, stockUnits }) => {
  const items = [
    { key: "sales", label: "Sales", value: sales, color: "#f5b400" },
    { key: "purchases", label: "Purchases", value: purchases, color: "#22c55e" },
    { key: "returns", label: "Returns", value: returns, color: "#ef4444" },
    { key: "stock", label: "Stock", value: stockUnits, color: "#3b82f6" },
  ];

  const total = items.reduce((sum, item) => sum + toNumber(item.value), 0);

  return items.map((item) => ({
    ...item,
    percentage: total > 0 ? Number(((toNumber(item.value) / total) * 100).toFixed(2)) : 0,
  }));
};

const getMainFirmScope = async (req) => {
  const queryFirmId = req.query?.firmId ? Number(req.query.firmId) : null;
  const { id, role } = req.user || {};

  if (role === "superadmin") {
    if (!queryFirmId) {
      return { where: {}, firm: null, effectiveFirmId: null };
    }

    const firm = await Firm.findByPk(queryFirmId);
    return { where: { firmId: queryFirmId }, firm, effectiveFirmId: queryFirmId };
  }

  if (queryFirmId) {
    const firm = await Firm.findOne({ where: { id: queryFirmId } });
    return {
      where: { userId: id, firmId: queryFirmId },
      firm,
      effectiveFirmId: queryFirmId,
    };
  }

  return { where: { userId: id }, firm: null, effectiveFirmId: null };
};

const getTenantFirmScope = async (tenantOwnerId, workspaceUserId, queryFirmId) => {
  const context = await getTenantContext(tenantOwnerId);

  let effectiveFirmId = queryFirmId ? Number(queryFirmId) : null;

  if (!effectiveFirmId && workspaceUserId) {
    const workspaceFirm = await context.TenantFirm.findOne({
      where: { userId: workspaceUserId },
      attributes: ["id", "firmName"],
    });
    effectiveFirmId = workspaceFirm?.id || null;
  }

  const firm = effectiveFirmId
    ? await context.TenantFirm.findByPk(effectiveFirmId, {
        attributes: ["id", "firmName"],
      })
    : null;

  return { context, firm, effectiveFirmId };
};

export const getDashboardSummary = async (req, res) => {
  try {
    const { tenantOwnerId, workspaceUserId } = resolveTenantRequestContext(req);

    if (!tenantOwnerId) {
      return res.status(401).json({ message: "Authenticated user not found." });
    }

    if (await isClientWorkspaceUser(tenantOwnerId)) {
      const { context, firm, effectiveFirmId } = await getTenantFirmScope(
        tenantOwnerId,
        workspaceUserId,
        req.query?.firmId,
      );

      const baseWhere = { userId: tenantOwnerId };
      if (effectiveFirmId) {
        baseWhere.firmId = effectiveFirmId;
      }

      const [sales, purchases, returns, stockUnits] = await Promise.all([
        context.TenantSell.sum("finalAmount", { where: baseWhere }),
        context.TenantPurchase.sum("totalAmount", { where: baseWhere }),
        context.TenantReturn.sum("totalReturnAmount", { where: baseWhere }),
        context.TenantProduct.sum("totalQuantity", { where: { userId: tenantOwnerId } }),
      ]);

      const cards = {
        sales: toNumber(sales),
        purchases: toNumber(purchases),
        returns: toNumber(returns),
        stockUnits: toNumber(stockUnits),
      };

      return res.status(200).json({
        workspace: "client",
        firm: firm
          ? { id: firm.id, firmName: firm.firmName }
          : null,
        cards,
        breakdown: buildBreakdown(cards),
        comparison: [
          { label: "Sales", value: cards.sales },
          { label: "Purchases", value: cards.purchases },
          { label: "Returns", value: cards.returns },
          { label: "Stock", value: cards.stockUnits },
        ],
      });
    }

    const { where, firm, effectiveFirmId } = await getMainFirmScope(req);

    const [sales, purchases, returns, stockUnits] = await Promise.all([
      Sell.sum("finalAmount", { where }),
      Purchase.sum("totalAmount", { where }),
      Return.sum("totalReturnAmount", { where }),
      Product.sum("totalQuantity", {
        where: where.userId ? { userId: where.userId } : {},
      }),
    ]);

    const cards = {
      sales: toNumber(sales),
      purchases: toNumber(purchases),
      returns: toNumber(returns),
      stockUnits: toNumber(stockUnits),
    };

    return res.status(200).json({
      workspace: "main",
      firm: effectiveFirmId && firm
        ? { id: firm.id, firmName: firm.firmName }
        : null,
      cards,
      breakdown: buildBreakdown(cards),
      comparison: [
        { label: "Sales", value: cards.sales },
        { label: "Purchases", value: cards.purchases },
        { label: "Returns", value: cards.returns },
        { label: "Stock", value: cards.stockUnits },
      ],
    });
  } catch (error) {
    console.error("Get Dashboard Summary Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

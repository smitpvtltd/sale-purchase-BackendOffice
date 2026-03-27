import Stock from "../Models/stockModel.js";
import {
  createStockService,
  updateStockService,
  deleteStockService,
  getAllStocksService,
  getStockByIdService
} from "../Services/stockService.js";
import {
  createTenantStock,
  deleteTenantStockById,
  getNextTenantStockRef,
  getTenantStockById,
  getTenantStocks,
  isClientWorkspaceUser,
  updateTenantStockById,
} from "../Services/tenantDbService.js";


// Helper (reuse same logic as service)
const generateNextRefNumber = async (userId) => {
  if (userId && await isClientWorkspaceUser(userId)) {
    return await getNextTenantStockRef(userId);
  }
  const lastStock = await Stock.findOne({ order: [['id', 'DESC']] });
  let nextNumber = 1;
  if (lastStock && lastStock.refNumber) {
    const match = lastStock.refNumber.match(/STK-(\d+)/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }
  return `STK-${String(nextNumber).padStart(4, '0')}`;
};

// Controller to get next refNumber (optional)
export const getNextRefNumber = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const nextRef = await generateNextRefNumber(userId);
    res.status(200).json({ nextRef });
  } catch (error) {
    console.error("Get Next Ref Error:", error);
    res.status(500).json({ message: "Error generating next ref number" });
  }
};

export const createStock = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    if (await isClientWorkspaceUser(userId)) {
      const newStock = await createTenantStock(userId, { ...req.body, userId });
      return res.status(201).json(newStock);
    }

    const newStock = await createStockService({ ...req.body, userId });
    res.status(201).json(newStock);
  } catch (error) {
    console.error("Create Stock Error:", error);
    res.status(500).json({ message: "Error creating stock" });
  }
};

export const updateStock = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const stock =
      userId && await isClientWorkspaceUser(userId)
        ? await updateTenantStockById(userId, req.params.id, req.body)
        : await updateStockService(req.params.id, req.body);
    res.status(200).json(stock);
  } catch (error) {
    console.error("Update Stock Error:", error);
    res.status(500).json({ message: "Error updating stock" });
  }
};

export const deleteStock = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const result =
      userId && await isClientWorkspaceUser(userId)
        ? await deleteTenantStockById(userId, req.params.id)
        : await deleteStockService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Delete Stock Error:", error);
    res.status(500).json({ message: "Error deleting stock" });
  }
};

export const getAllStocks = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    const isClientUser = await isClientWorkspaceUser(userId);
    const stocks = isClientUser
      ? await getTenantStocks(userId)
      : await getAllStocksService(userId);
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Get Stocks Error:", error);
    res.status(500).json({ message: "Error fetching stocks" });
  }
};

export const getStockById = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const stock =
      userId && await isClientWorkspaceUser(userId)
        ? await getTenantStockById(userId, req.params.id)
        : await getStockByIdService(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.status(200).json(stock);
  } catch (error) {
    console.error("Get Stock Error:", error);
    res.status(500).json({ message: "Error fetching stock" });
  }
};

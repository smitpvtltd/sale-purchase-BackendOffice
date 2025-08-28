import * as advanceSettlementService from "../Services/AdvanceSettlementService.js";

// Create a new advance settlement
export const createAdvanceSettlement = async (req, res) => {
  try {
    const {
      date,
      settlementNumber,
      billType,
      firmId,
      receiptId,
      advanceAmount,
      billDetails,
      userId,
    } = req.body;

    // Basic input validation (can be extended)
    if (
      !date ||
      !settlementNumber ||
      !billType ||
      !firmId ||
      !advanceAmount ||
      !userId
    ) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // receiptId can be null if allowed by your logic; if required, add validation here

    const settlementData = {
      date,
      settlementNumber,
      billType,
      firmId,
      receiptId: receiptId || null,
      advanceAmount,
      billDetails,
      userId,
    };

    const settlement = await advanceSettlementService.createSettlement(
      settlementData
    );

    return res.status(201).json({
      message: "Advance settlement created successfully",
      settlement,
    });
  } catch (error) {
    // Detailed Sequelize validation error handling
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // General error fallback
    console.error("Create advance settlement error:", error);
    return res
      .status(500)
      .json({
        message: "Error creating advance settlement",
        error: error.message,
      });
  }
};

// Get all advance settlements for a user
export const getAdvanceSettlements = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ message: "userId is required." });

    const settlements = await advanceSettlementService.getSettlements(userId);
    return res.status(200).json(settlements);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Error fetching advance settlements",
        error: error.message,
      });
  }
};

// Edit (Update) an existing advance settlement
export const updateAdvanceSettlement = async (req, res) => {
  try {
    const { id } = req.params; // Settlement ID from URL
    const {
      date,
      settlementNumber,
      billType,
      firmId,
      receiptId,
      advanceAmount,
      billDetails,
    } = req.body;

    if (
      !date ||
      !settlementNumber ||
      !billType ||
      !firmId ||
      !receiptId ||
      !advanceAmount
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedSettlement = await advanceSettlementService.updateSettlement(
      id,
      {
        date,
        settlementNumber,
        billType,
        firmId,
        receiptId,
        advanceAmount,
        billDetails,
      }
    );

    return res.status(200).json({
      message: "Advance settlement updated successfully",
      updatedSettlement,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Error updating advance settlement",
        error: error.message,
      });
  }
};

// Delete an existing advance settlement
export const deleteAdvanceSettlement = async (req, res) => {
  try {
    const { id } = req.params; // Settlement ID from URL

    const result = await advanceSettlementService.deleteSettlement(id);

    if (result) {
      return res
        .status(200)
        .json({ message: "Advance settlement deleted successfully" });
    } else {
      return res.status(404).json({ message: "Settlement not found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "Error deleting advance settlement",
        error: error.message,
      });
  }
};

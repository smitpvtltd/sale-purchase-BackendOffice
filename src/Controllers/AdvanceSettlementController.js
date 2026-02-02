import {
  addAdvanceSettlement,
  getAllAdvanceSettlements,
  findSettlementById,
  findSettlementByNumber,
  updateAdvanceSettlementById,
  deleteAdvanceSettlementById,
  generateNextReceiptNumber,
} from '../Services/AdvanceSettlementService.js';

// Create
export const createAdvanceSettlement = async (req, res) => {
  const { date, settlementNumber, firmId, partyId, advanceAmount, userId } = req.body;

  if (!date || !settlementNumber || !firmId || !partyId || !advanceAmount || !userId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existing = await findSettlementByNumber(settlementNumber);
    if (existing) {
      return res.status(409).json({ message: 'Settlement number already exists.' });
    }

    const settlement = await addAdvanceSettlement({
      date, settlementNumber, firmId, partyId, advanceAmount, userId,
    });

    res.status(201).json({ message: 'Settlement created.', settlement });
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all for a user
export const getAdvanceSettlements = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  try {
    const settlements = await getAllAdvanceSettlements(userId);
    res.status(200).json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update existing by ID
export const updateAdvanceSettlement = async (req, res) => {
  const { id } = req.params;
  const { date, settlementNumber, firmId, partyId, advanceAmount } = req.body;

  if (!date || !settlementNumber || !firmId || !partyId || !advanceAmount) {
    return res.status(400).json({ message: 'All fields are required for update.' });
  }

  try {
    const existing = await findSettlementById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Settlement not found.' });
    }

    // Check for duplicate settlement number on update
    if (settlementNumber !== existing.settlementNumber) {
      const conflict = await findSettlementByNumber(settlementNumber);
      if (conflict) {
        return res.status(409).json({ message: 'Settlement number already in use.' });
      }
    }

    const updated = await updateAdvanceSettlementById(id, {
      date, settlementNumber, firmId, partyId, advanceAmount,
    });

    res.status(200).json({ message: 'Settlement updated.', settlement: updated });
  } catch (error) {
    console.error('Error updating settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete by ID
export const deleteAdvanceSettlement = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await findSettlementById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Settlement not found.' });
    }

    await deleteAdvanceSettlementById(id);

    res.status(200).json({ message: 'Settlement deleted.' });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get receipt number helper (if needed separately)
export const getReceiptNumber = async (req, res) => {
  const { type, userId } = req.query;

  if (!type || !userId) {
    return res.status(400).json({ message: 'Both type and userId are required.' });
  }

  try {
    const receiptNumber = await generateNextReceiptNumber();
    res.status(200).json(receiptNumber);
  } catch (error) {
    console.error('Error generating receipt number:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

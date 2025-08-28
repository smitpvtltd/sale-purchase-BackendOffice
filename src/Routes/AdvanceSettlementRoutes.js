import express from 'express';
import {
  createAdvanceSettlement,
  getAdvanceSettlements,
  updateAdvanceSettlement,
  deleteAdvanceSettlement,
} from '../Controllers/AdvanceSettlementController.js';
import AdvanceSettlement from '../Models/AdvanceSettlementModel.js';

const router = express.Router();

// Route to create an advance settlement
router.post('/add', createAdvanceSettlement);

// Route to get all advance settlements for a user
router.get('/all', getAdvanceSettlements);

// Route to update an existing advance settlement
router.put('/update/:id', updateAdvanceSettlement);

// Route to delete an existing advance settlement
router.delete('/delete/:id', deleteAdvanceSettlement);


// Add this before `export default router;`
router.get('/receipt-number', async (req, res) => {
  const { type, userId } = req.query;

  if (!type || !userId) {
    return res.status(400).json({ message: 'Both type and userId are required.' });
  }

  try {
    const settlements = await AdvanceSettlement.findAll({
      where: { billType: type, userId },
    });

    // Just return count, frontend formats number as needed
    res.status(200).json(settlements);
  } catch (error) {
    console.error('Error fetching receipt numbers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;

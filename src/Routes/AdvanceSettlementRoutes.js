import express from 'express';
import {
  createAdvanceSettlement,
  getAdvanceSettlements,
  updateAdvanceSettlement,
  deleteAdvanceSettlement,
} from '../Controllers/AdvanceSettlementController.js';
import AdvanceSettlement from '../Models/AdvanceSettlementModel.js';
import { generateNextReceiptNumber } from '../Services/AdvanceSettlementService.js';


const router = express.Router();

// Route to create an advance settlement
router.post('/add', createAdvanceSettlement);

// Route to get all advance settlements for a user
router.get('/all', getAdvanceSettlements);

// Route to update an existing advance settlement
router.put('/update/:id', updateAdvanceSettlement);

// Route to delete an existing advance settlement
router.delete('/delete/:id', deleteAdvanceSettlement);


// new receipt number route
router.get('/receipt-number', async (req, res) => {
  const { type, userId } = req.query;

  if (!type || !userId) {
    return res.status(400).json({ message: 'Both type and userId are required.' });
  }

  try {
    const nextNumber = await generateNextReceiptNumber();

    res.status(200).json({ nextNumber });
  } catch (error) {
    console.error('Error generating receipt number:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});


export default router;

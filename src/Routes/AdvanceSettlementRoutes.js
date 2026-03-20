import express from 'express';
import {
  createAdvanceSettlement,
  getAdvanceSettlements,
  getAdvanceSettlementById,
  updateAdvanceSettlement,
  deleteAdvanceSettlement,
  getPendingBills,
  allocateAdvanceSettlement,
  getReceiptNumber,
} from '../Controllers/AdvanceSettlementController.js';

const router = express.Router();

// Route to create an advance settlement
router.post('/add', createAdvanceSettlement);

// Route to get all advance settlements for a user
router.get('/all', getAdvanceSettlements);
router.get('/pending-bills', getPendingBills);
router.get('/receipt-number', getReceiptNumber);

// Route to update an existing advance settlement
router.put('/update/:id', updateAdvanceSettlement);

// Route to delete an existing advance settlement
router.delete('/delete/:id', deleteAdvanceSettlement);
router.post('/:id/allocate', allocateAdvanceSettlement);
router.get('/:id', getAdvanceSettlementById);

export default router;

import express from 'express';
import {
  createCustomer,
  getCustomers,
  editCustomer,
  removeCustomer,
} from '../Controllers/customerController.js';

const router = express.Router();

router.post('/add', createCustomer);
router.get('/all', getCustomers);
router.put('/edit/:id', editCustomer);
router.delete('/delete/:id', removeCustomer);

export default router;

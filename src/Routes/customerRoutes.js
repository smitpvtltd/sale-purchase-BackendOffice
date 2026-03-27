import express from 'express';
import {
  createCustomer,
  getCustomers,
  editCustomer,
  removeCustomer,
} from '../Controllers/customerController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

import { uploadFor } from "../Middleware/uploadMiddleware.js";


const router = express.Router();

// Use upload middleware for 'customer' folder
const customerUpload = uploadFor("customer");

router.post('/add', authenticateToken, customerUpload.array("customerImg", 5), createCustomer);
router.get('/all', authenticateToken, getCustomers);
router.put('/edit/:id', authenticateToken, customerUpload.array("customerImg", 5), editCustomer);
router.delete('/delete/:id', authenticateToken, removeCustomer);

export default router;

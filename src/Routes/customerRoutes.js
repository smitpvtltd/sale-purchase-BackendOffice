import express from 'express';
import {
  createCustomer,
  getCustomers,
  editCustomer,
  removeCustomer,
} from '../Controllers/customerController.js';

import { uploadFor } from "../Middleware/uploadMiddleware.js";


const router = express.Router();

// Use upload middleware for 'customer' folder
const customerUpload = uploadFor("customer");

router.post('/add', customerUpload.array("customerImg", 5), createCustomer);
router.get('/all', getCustomers);
router.put('/edit/:id', customerUpload.array("customerImg", 5), editCustomer);
router.delete('/delete/:id', removeCustomer);

export default router;

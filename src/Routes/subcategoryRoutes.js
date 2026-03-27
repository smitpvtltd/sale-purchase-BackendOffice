import express from 'express';
import {
  createSubcategory,
  getSubcategories,
  editSubcategory,
  removeSubcategory,
} from '../Controllers/subcategoryController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();

router.post('/add', authenticateToken, createSubcategory);
router.get('/all', authenticateToken, getSubcategories);
router.put('/edit/:id', authenticateToken, editSubcategory);
router.delete('/delete/:id', authenticateToken, removeSubcategory);

export default router;

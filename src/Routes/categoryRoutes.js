import express from 'express';
import {
  createCategory,
  getCategories,
  editCategory,
  removeCategory
} from '../Controllers/categoryController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();

router.post('/add', authenticateToken, createCategory);
router.get('/all', authenticateToken, getCategories);
router.put('/edit/:id', authenticateToken, editCategory);
router.delete('/delete/:id', authenticateToken, removeCategory);

export default router;

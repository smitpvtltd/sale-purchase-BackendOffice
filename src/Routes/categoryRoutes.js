import express from 'express';
import {
  createCategory,
  getCategories,
  editCategory,
  removeCategory
} from '../Controllers/categoryController.js';

const router = express.Router();

router.post('/add', createCategory);             // POST /category/add
router.get('/all', getCategories);               // GET  /category/all
router.put('/edit/:id', editCategory);           // PUT  /category/edit/:id
router.delete('/delete/:id', removeCategory);    // DELETE /category/delete/:id

export default router;

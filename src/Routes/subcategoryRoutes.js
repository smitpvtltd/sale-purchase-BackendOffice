import express from 'express';
import {
  createSubcategory,
  getSubcategories,
  editSubcategory,
  removeSubcategory,
} from '../Controllers/subcategoryController.js';

const router = express.Router();

router.post('/add', createSubcategory);             // POST /subcategory/add
router.get('/all', getSubcategories);               // GET  /subcategory/all?categoryId=1
router.put('/edit/:id', editSubcategory);           // PUT  /subcategory/edit/:id
router.delete('/delete/:id', removeSubcategory);    // DELETE /subcategory/delete/:id

export default router;

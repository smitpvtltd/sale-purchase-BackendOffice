import express from 'express';
import {
  addStock,
  getStocks,
  getSingleStock,
  editStock,
  deleteStock
} from '../Controllers/stockController.js';

const router = express.Router();

router.post('/add', addStock);
router.get('/all', getStocks);
router.get('/:id', getSingleStock);
router.put('/edit/:id', editStock);
router.delete('/delete/:id', deleteStock);

export default router;

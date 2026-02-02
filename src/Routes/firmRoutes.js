import express from 'express';
import {
  addFirm,
  getFirms,
  getSingleFirm,
  editFirm,
  removeFirm
} from '../Controllers/firmController.js';

import { uploadFor } from '../Middleware/uploadMiddleware.js'; // Assumes multer config
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();
const firmUpload = uploadFor('firm');

router.post('/add',authenticateToken, firmUpload.single('firmLogo'), addFirm);
router.get('/all', authenticateToken, getFirms);
router.get('/:id',authenticateToken, getSingleFirm);
router.put('/edit/:id',authenticateToken, firmUpload.single('firmLogo'), editFirm);
router.delete('/delete/:id',authenticateToken, removeFirm);

export default router;

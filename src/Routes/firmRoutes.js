import express from 'express';
import {
  addFirm,
  getFirms,
  getSingleFirm,
  editFirm,
  removeFirm
} from '../Controllers/firmController.js';

import { uploadFor } from '../Middleware/uploadMiddleware.js'; // Assumes multer config

const router = express.Router();
const firmUpload = uploadFor('firm');

router.post('/add', firmUpload.single('firmLogo'), addFirm);
router.get('/all', getFirms);
router.get('/:id', getSingleFirm);
router.put('/edit/:id', firmUpload.single('firmLogo'), editFirm);
router.delete('/delete/:id', removeFirm);

export default router;

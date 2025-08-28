import express from 'express';
import { fetchStates } from '../Controllers/stateController.js';

const router = express.Router();

router.get('/all', fetchStates);  // GET /api/states

export default router;

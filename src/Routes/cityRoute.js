import express from 'express';
import { fetchCitiesByState } from '../Controllers/cityController.js';

const router = express.Router();

router.get('/all/:stateId', fetchCitiesByState); // GET /api/cities/:stateId

export default router;

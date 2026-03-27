import express from "express";
import { getDashboardSummary } from "../Controllers/dashboardController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.get("/summary", authenticateToken, getDashboardSummary);

export default router;

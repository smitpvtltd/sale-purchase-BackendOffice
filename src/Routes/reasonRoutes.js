import express from "express";
import { addReason, fetchReasons } from "../Controllers/reasonController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, addReason);
router.get("/all", authenticateToken, fetchReasons);

export default router;

import express from "express";
import {
  createReturn,
  getEligibleReturnBills,
  getReturns,
  removeReturn,
} from "../Controllers/returnController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, createReturn);
router.get("/eligible-bills", authenticateToken, getEligibleReturnBills);
router.get("/all", authenticateToken, getReturns);
router.delete("/delete/:id", authenticateToken, removeReturn);

export default router;

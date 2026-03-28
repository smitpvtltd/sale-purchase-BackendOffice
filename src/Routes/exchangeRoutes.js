import express from "express";
import {
  createExchange,
  getEligibleExchangeBills,
  getExchanges,
  removeExchange,
  updateExchangePayment,
} from "../Controllers/exchangeController.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();

router.post("/add", authenticateToken, createExchange);
router.get("/eligible-bills", authenticateToken, getEligibleExchangeBills);
router.get("/all", authenticateToken, getExchanges);
router.delete("/delete/:id", authenticateToken, removeExchange);
router.put("/edit/:id", authenticateToken, updateExchangePayment);


export default router;

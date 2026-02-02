import express from "express";
import {
  createExchange,
  getExchanges,
  removeExchange,
  updateExchangePayment,
} from "../Controllers/exchangeController.js";

const router = express.Router();

router.post("/add", createExchange);
router.get("/all", getExchanges);
router.delete("/delete/:id", removeExchange);
router.put("/edit/:id", updateExchangePayment);


export default router;

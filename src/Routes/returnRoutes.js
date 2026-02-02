import express from "express";
import {
  createReturn,
  getReturns,
  removeReturn,
} from "../Controllers/returnController.js";

const router = express.Router();

router.post("/add", createReturn);
router.get("/all", getReturns);
router.delete("/delete/:id", removeReturn);

export default router;

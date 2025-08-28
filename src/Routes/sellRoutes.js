import express from "express";
import {
  createSell,
  getAllSells,
  getSellById
} from "../Controllers/sellController.js";

const router = express.Router();

router.post("/create-bill", createSell);
router.get("/get-bill", getAllSells);
router.get("/:id", getSellById);


export default router;

import express from "express";
import { getMenuItems } from "../Controllers/menuController.js";

const router = express.Router();

router.get("/all", getMenuItems);

export default router;
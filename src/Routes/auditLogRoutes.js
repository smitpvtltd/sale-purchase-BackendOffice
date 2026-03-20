import express from "express";
import { getAuditLogsByTypeAndBill } from "../Controllers/auditLogController.js";

const router = express.Router();

router.get("/:type/:billNo", getAuditLogsByTypeAndBill);

export default router;

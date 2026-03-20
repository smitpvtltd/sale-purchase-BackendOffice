import express from "express";
import {
  getLedgers,
  getLedgerById,
  getLedgerByPartyId,
} from "../Controllers/ledgerController.js";

const router = express.Router();

router.get("/all", getLedgers);
router.get("/party/:partyId", getLedgerByPartyId);
router.get("/:id", getLedgerById);

export default router;

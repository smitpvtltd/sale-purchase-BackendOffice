import express from "express";
import {
  createChallan,
  getAllChallans,
  getChallanById,
  updateChallan,
  deleteChallan,
  previewChallanNumber,
} from "../Controllers/ChallanEntryController.js";


const router = express.Router();

// new delivery challan preview
router.get("/preview", previewChallanNumber);

// Create a new delivery challan
router.post("/add", createChallan);

// Get all challans for a user
router.get("/all", getAllChallans);

// Get a specific challan by ID
router.get("/:id", getChallanById);

// Update challan by ID
router.put('/update/:id', updateChallan);

// Delete challan by ID
router.delete('/delete/:id', deleteChallan);




export default router;

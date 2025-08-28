import express from "express";
import {
  addEmployee,
  getEmployees,
  getSingleEmployee,
  editEmployee,
  removeEmployee,
} from "../Controllers/employeeController.js";

import { uploadFor } from "../Middleware/uploadMiddleware.js";

const router = express.Router();
const employeeUpload = uploadFor("employee"); // Folder: uploads/employee/

router.post("/add", employeeUpload.single("image"), addEmployee);
router.get("/all", getEmployees);
router.get("/:id", getSingleEmployee);
router.put("/edit/:id", employeeUpload.single("image"), editEmployee);
router.delete("/delete/:id", removeEmployee);

export default router;
import express from "express";
import {
  addEmployee,
  getEmployees,
  getSingleEmployee,
  editEmployee,
  removeEmployee,
  employeeLogin,
} from "../Controllers/employeeController.js";

import { uploadFor } from "../Middleware/uploadMiddleware.js";
import { authenticateToken } from "../Middleware/authenticateToken.js";

const router = express.Router();
const employeeUpload = uploadFor("employee"); // Folder: uploads/employee/


router.post("/login", employeeLogin); // employee login
router.post("/add", authenticateToken, employeeUpload.single("image"), addEmployee);
router.get("/all", authenticateToken, getEmployees);
router.get("/:id", authenticateToken, getSingleEmployee);
router.put("/edit/:id", authenticateToken, employeeUpload.single("image"), editEmployee);
router.delete("/delete/:id", authenticateToken, removeEmployee);

export default router;

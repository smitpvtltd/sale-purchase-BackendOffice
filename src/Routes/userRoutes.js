import express from 'express';
import { createClient, editUser, getAllUser, getUsers, login, removeUser, updateClientStatus } from '../Controllers/userController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';
import { uploadFor } from '../Middleware/uploadMiddleware.js';

const router = express.Router();
const clientUpload = uploadFor("client");

router.post('/login', login);   //login user
router.post('/clients', authenticateToken, clientUpload.single('clientLogo'), createClient);
router.patch('/clients/:id/status', authenticateToken, updateClientStatus);
router.get('/all',authenticateToken, getAllUser);  // old getAllUser (by userId)
router.get('/role-wise',authenticateToken, getUsers);            // NEW: get users based on role and userId
router.put('/edit/:id',authenticateToken, editUser);      // PUT /user/edit/:id
router.delete('/delete/:id',authenticateToken, removeUser); // DELETE /user/delete/:id

export default router;

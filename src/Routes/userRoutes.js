import express from 'express';
import { editUser, getAllUser, getUsers, login, removeUser } from '../Controllers/userController.js';
import { authenticateToken } from '../Middleware/authenticateToken.js';

const router = express.Router();

router.post('/login', login);   //login user
router.get('/all',authenticateToken, getAllUser);  // old getAllUser (by userId)
router.get('/role-wise',authenticateToken, getUsers);            // NEW: get users based on role and userId
router.put('/edit/:id',authenticateToken, editUser);      // PUT /user/edit/:id
router.delete('/delete/:id',authenticateToken, removeUser); // DELETE /user/delete/:id

export default router;

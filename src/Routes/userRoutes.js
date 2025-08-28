import express from 'express';
import { editUser, getAllUser, getUsers, login, removeUser } from '../Controllers/userController.js';

const router = express.Router();

router.post('/login', login);   //login user
router.get('/all', getAllUser);  // old getAllUser (by userId)
router.get('/role-wise', getUsers);            // NEW: get users based on role and userId
router.put('/edit/:id', editUser);      // PUT /user/edit/:id
router.delete('/delete/:id', removeUser); // DELETE /user/delete/:id

export default router;

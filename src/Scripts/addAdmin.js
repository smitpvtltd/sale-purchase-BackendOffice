// Usage: node scripts/addUsers.js
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { createUser } from '../Services/userService.js';

dotenv.config();

const addUsers = async () => {
  const usersToCreate = [
    // { username: 'admin', password: '0101', role: 'admin' },
    { username: 'superadmin', password: '0101', role: 'superadmin' },
  ];

  for (const user of usersToCreate) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const createdUser = await createUser(user.username, hashedPassword, user.role);
      console.log(`✅ ${user.role} created:`, createdUser.username);
    } catch (err) {
      console.error(`❌ Error creating ${user.role} (${user.username}):`, err.message);
    }
  }
};


addUsers();

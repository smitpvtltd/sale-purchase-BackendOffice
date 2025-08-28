import MenuItem from '../Models/menuItemModel.js';
import { Op } from 'sequelize';

export const getMenuItemsByRole = async (role) => {
  return await MenuItem.findAll({
    where: {
      roles: {
        [Op.like]: `%${role}%`
      }
    },
    order: [['id', 'ASC']],
  });
};

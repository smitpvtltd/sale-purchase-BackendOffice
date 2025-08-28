import { getMenuItemsByRole } from '../Services/menuService.js';

export const getMenuItems = async (req, res) => {
  const { role } = req.query;

  if (!role) {
    return res.status(400).json({ message: 'Role is required.' });
  }

  try {
    const menuItems = await getMenuItemsByRole(role);
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

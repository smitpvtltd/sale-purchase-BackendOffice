import MenuItem from '../Models/menuItemModel.js';
import { Op } from 'sequelize';

const buildRoleCondition = (roleName) => ({
  [Op.or]: [
    { [Op.eq]: roleName },
    { [Op.like]: `${roleName},%` },
    { [Op.like]: `%,${roleName},%` },
    { [Op.like]: `%,${roleName}` },
  ],
});

export const getMenuItemsByRole = async (role, options = {}) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const roleMatchers = [normalizedRole];
  let excludedPaths = [];
  const isTenantFirmAdmin =
    Boolean(options?.tenantOwnerId) || Boolean(options?.workspaceUserId);

  // Client workspace uses nearly the same operational menus as admin.
  if (normalizedRole === "client") {
    roleMatchers.push("admin");
  }

  if (normalizedRole === "client_admin" || (normalizedRole === "admin" && isTenantFirmAdmin)) {
    roleMatchers.push("admin", "client");
    excludedPaths = ["/firm"];
  }

  const items = await MenuItem.findAll({
    where: {
      [Op.or]: roleMatchers.map((roleName) => ({
        roles: buildRoleCondition(roleName),
      })),
    },
    order: [['id', 'ASC']],
  });

  if (!excludedPaths.length) {
    return items;
  }

  return items.filter((item) => !excludedPaths.includes(item.path));
};

import sequelize from '../Config/db.js';
import MenuItem from '../Models/menuItemModel.js';

const seedMenuItems = async () => {
  try {
    // Sync DB without dropping tables (use force: true if you want to reset)
    await sequelize.sync({ force: false });

    await MenuItem.bulkCreate([
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        path: "/",
        color: "from-blue-500 to-purple-600",
        roles: "admin,superadmin",
      },
      {
        label: "Category",
        icon: "BookCopy",
        path: "/category",
        color: "from-orange-500 to-red-600",
        roles: "admin",
      },
      {
        label: "Firm",
        icon: "Landmark",
        path: "/firm",
        color: "from-indigo-500 to-cyan-600",
        roles: "admin,superadmin",
      },
      {
        label: "Employee",
        icon: "UserCog",
        path: "/employee",
        color: "from-pink-600 to-yellow-700",
        roles: "admin",
      },
      {
        label: "Customers",
        icon: "Users",
        path: "/customers",
        color: "from-pink-500 to-indigo-600",
        roles: "admin",
      },
      {
        label: "Products",
        icon: "PackagePlus",
        path: "/products",
        color: "from-emerald-500 to-teal-600",
        roles: "admin",
      },
      {
        label: "Purchase Party",
        icon: "TicketPercent",
        path: "/purchase-party",
        color: "from-yellow-500 to-amber-600",
        roles: "admin",
      },
      {
        label: "Sales",
        icon: "HandCoins",
        path: "/sells",
        color: "from-purple-500 to-orange-600",
        roles: "admin",
      },
      {
        label: "Purchase",
        icon: "ShoppingBag",
        path: "/purchase",
        color: "from-green-600 to-yellow-600",
        roles: "admin",
      },
      {
        label: "Receipt",
        icon: "ClipboardList",
        path: "/entry-receipt",
        color: "from-fuchsia-500 to-pink-600",
        roles: "admin",
      },
      {
        label: "Quotation",
        icon: "NotebookPen",
        path: "/quotation-entry",
        color: "from-green-500 to-black-700",
        roles: "admin",
      },
      {
        label: "Adv/RT Settlement",
        icon: "Banknote",
        path: "/advance-settlement",
        color: "from-cyan-500 to-sky-600",
        roles: "admin",
      },
      {
        label: "Delivery Challan",
        icon: "TruckElectric",
        path: "/delivery-challan",
        color: "from-pink-700 to-blue-800",
        roles: "admin",
      },
      {
        label: "Reports",
        icon: "PieChart",
        path: "/reports",
        color: "from-rose-500 to-red-600",
        roles: "admin",
      },
      {
        label: "Payments",
        icon: "Wallet",
        path: "/payments",
        color: "from-teal-500 to-emerald-600",
        roles: "admin",
      },
      {
        label: "Lasers",
        icon: "Cpu",
        path: "/lasers",
        color: "from-green-500 to-lime-600",
        roles: "admin",
      }
    ]);

    console.log('Menu items seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed menu items:', error);
    process.exit(1);
  }
};

seedMenuItems();

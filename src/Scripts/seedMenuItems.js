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
        roles: "admin,superadmin,employee"
      },
      {
        label: "Firm",
        icon: "Landmark",
        path: "/firm",
        roles: "superadmin,admin",
      },
      {
        label: "Sales",
        icon: "HandCoins",
        path: "/sells",
        roles: "admin,employee"
      },
      {
        label: "Expenses",
        icon: "DollarSign",
        path: "/expenses",
        roles: "admin,employee"
      },
      {
        label: "Return/Exchange",
        icon: "RefreshCw",
        path: "/return-exchange",
        roles: "admin,employee"
      },
      {
        label: "Products",
        icon: "PackagePlus",
        path: "/products",
        roles: "admin,employee"
      },
      {
        label: "Sale-Customers",
        icon: "Users",
        path: "/customers",
        roles: "admin,employee"
      },
      {
        label: "Employee",
        icon: "UserCog",
        path: "/employee",
        roles: "admin,employee"
      },
      {
        label: "Adv/RT Settlement",
        icon: "Banknote",
        path: "/advance-settlement",
        roles: "admin,employee"
      },
      {
        label: "Purchase",
        icon: "ShoppingBag",
        path: "/purchase",
        roles: "admin,employee"
      },
      {
        label: "Purchase Party",
        icon: "TicketPercent",
        path: "/purchase-party",
        roles: "admin,employee"
      },
      {
        label: "Purchase Receipt",
        icon: "ClipboardList",
        path: "/entry-receipt",
        roles: "admin,employee"
      },
      {
        label: "Category",
        icon: "BookCopy",
        path: "/category",
        roles: "admin,employee"
      },
      {
        label: "Ledgers",
        icon: "Cpu",
        path: "/ledgers",
        roles: "admin,superadmin"
      },
      {
        label: "Reports",
        icon: "PieChart",
        path: "/reports",
        roles: "admin,superadmin"
      },
      {
        label: "Quotation",
        icon: "NotebookPen",
        path: "/quotation-entry",
        roles: ""
      },
      {
        label: "Delivery Challan",
        icon: "TruckElectric",
        path: "/delivery-challan",
        roles: ""
      },
      {
        label: "Payments",
        icon: "Wallet",
        path: "/payments",
        roles: ""
      },
    ]);

    console.log('Menu items seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed menu items:', error);
    process.exit(1);
  }
};

seedMenuItems();

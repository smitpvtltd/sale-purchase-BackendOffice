import sequelize from "../Config/db.js";
import MenuItem from "../Models/menuItemModel.js";

const menuItems = [
  {
    label: "Dashboard",
    icon: "LayoutDashboard",
    path: "/",
    roles: "admin,superadmin,employee,client",
  },
  {
    label: "Firm",
    icon: "Landmark",
    path: "/firm",
    roles: "superadmin,admin,client",
  },
  {
    label: "Sales",
    icon: "HandCoins",
    path: "/sells",
    roles: "admin,employee,client",
  },
  {
    label: "Expenses",
    icon: "DollarSign",
    path: "/expenses",
    roles: "admin,employee,client",
  },
  {
    label: "Return/Exchange",
    icon: "RefreshCw",
    path: "/return-exchange",
    roles: "admin,employee,client",
  },
  {
    label: "Products",
    icon: "PackagePlus",
    path: "/products",
    roles: "admin,employee,client",
  },
  {
    label: "Sale-Customers",
    icon: "Users",
    path: "/customers",
    roles: "admin,employee,client",
  },
  {
    label: "Employee",
    icon: "UserCog",
    path: "/employee",
    roles: "admin,employee,client",
  },
  {
    label: "Adv/RT Settlement",
    icon: "Banknote",
    path: "/advance-settlement",
    roles: "admin,employee,client",
  },
  {
    label: "Purchase",
    icon: "ShoppingBag",
    path: "/purchase",
    roles: "admin,employee,client",
  },
  {
    label: "Purchase Party",
    icon: "TicketPercent",
    path: "/purchase-party",
    roles: "admin,employee,client",
  },
  {
    label: "Purchase Receipt",
    icon: "ClipboardList",
    path: "/entry-receipt",
    roles: "admin,employee,client",
  },
  {
    label: "Category",
    icon: "BookCopy",
    path: "/category",
    roles: "admin,employee,client",
  },
  {
    label: "Ledgers",
    icon: "Cpu",
    path: "/ledgers",
    roles: "admin,superadmin,client",
  },
  {
    label: "Reports",
    icon: "PieChart",
    path: "/reports",
    roles: "admin,superadmin,client",
  },
  {
    label: "Quotation",
    icon: "NotebookPen",
    path: "/quotation-entry",
    roles: "",
  },
  {
    label: "Delivery Challan",
    icon: "TruckElectric",
    path: "/delivery-challan",
    roles: "",
  },
  {
    label: "Payments",
    icon: "Wallet",
    path: "/payments",
    roles: "",
  },
  {
    label: "Client Management",
    icon: "Users",
    path: "/clients",
    roles: "superadmin",
  },
];

const seedMenuItems = async () => {
  try {
    await sequelize.sync({ force: false });

    for (const item of menuItems) {
      const existing = await MenuItem.findOne({ where: { path: item.path } });

      if (existing) {
        await existing.update(item);
      } else {
        await MenuItem.create(item);
      }
    }

    console.log("Menu items seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed menu items:", error);
    process.exit(1);
  }
};

seedMenuItems();

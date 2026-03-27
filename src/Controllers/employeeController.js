import {
  createEmployee,
  getEmployeesByUser,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../Services/employeeService.js';
import Employee from "../Models/employeeModel.js";
import MenuItem from "../Models/menuItemModel.js";
import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";
import {
  createTenantEmployee,
  deleteTenantEmployee,
  findTenantEmployeeByUsername,
  getTenantEmployeeById,
  getTenantEmployeesByUser,
  getTenantContext,
  isClientWorkspaceUser,
  resolveTenantRequestContext,
  updateTenantEmployee,
} from "../Services/tenantDbService.js";

const JWT_SECRET = process.env.JWT_SECRET;

const attachViewPageNames = async (employeeOrEmployees) => {
  if (!employeeOrEmployees) return employeeOrEmployees;

  const employees = Array.isArray(employeeOrEmployees)
    ? employeeOrEmployees
    : [employeeOrEmployees];

  const pageIds = [
    ...new Set(
      employees.flatMap((employee) =>
        Array.isArray(employee?.viewPages) ? employee.viewPages : [],
      ),
    ),
  ];

  const serialize = (employee) =>
    typeof employee.toJSON === "function" ? employee.toJSON() : { ...employee };

  if (!pageIds.length) {
    const unchanged = employees.map(serialize);
    return Array.isArray(employeeOrEmployees) ? unchanged : unchanged[0];
  }

  const menuItems = await MenuItem.findAll({
    where: { id: pageIds },
    attributes: ["id", "label"],
  });

  const labelMap = new Map(menuItems.map((item) => [Number(item.id), item.label]));
  const mapped = employees.map((employee) => {
    const plainEmployee = serialize(employee);

    return {
      ...plainEmployee,
      viewPageNames: Array.isArray(plainEmployee.viewPages)
        ? plainEmployee.viewPages
            .map((id) => labelMap.get(Number(id)))
            .filter(Boolean)
        : [],
    };
  });

  return Array.isArray(employeeOrEmployees) ? mapped : mapped[0];
};

const parseViewPagesInput = (viewPages) => {
  if (viewPages === undefined || viewPages === null || viewPages === "") {
    return [];
  }

  if (Array.isArray(viewPages)) {
    return viewPages;
  }

  if (typeof viewPages === "string") {
    const parsed = JSON.parse(viewPages);
    return Array.isArray(parsed) ? parsed : [];
  }

  return [];
};

// employee login
export const employeeLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  try {
    let user = await Employee.findOne({ where: { userName: username } });
    let tenantOwnerId = null;

    if (!user) {
      const clients = await User.findAll({
        where: { role: "client", isActive: true },
        attributes: ["id"],
      });

      for (const client of clients) {
        try {
          const tenantEmployee = await findTenantEmployeeByUsername(client.id, username);
          if (tenantEmployee) {
            user = tenantEmployee;
            tenantOwnerId = client.id;
            break;
          }
        } catch (error) {
          console.error(`Tenant employee lookup failed for client ${client.id}:`, error);
        }
      }
    }

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Plain password comparison for employee
    if (password !== user.password)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const payload = {
      id: user.id,
      username: user.userName,
      role: "employee",
      viewPages: user.viewPages,
      tenantOwnerId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      token,
      role: "employee",
      userId: user.id,
      username: user.userName,
      viewPages: user.viewPages,
      viewPageNames: (await attachViewPageNames(user)).viewPageNames,
      tenantOwnerId,
    });
  } catch (error) {
    console.error("Employee login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// add employee
export const addEmployee = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const {
      name,
      contact,
      email,
      address,
      firmId,
      userName,
      password,
      viewPages,
    } = req.body;

    if (!name || !firmId || !userName || !password || !tenantOwnerId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const image = req.file?.filename;
    const employeePayload = {
      name,
      contact,
      email,
      address,
      image,
      firmId,
      userName,
      password,
      userId: tenantOwnerId,
      viewPages: parseViewPagesInput(viewPages),
    };

    if (await isClientWorkspaceUser(tenantOwnerId)) {
      const employee = await createTenantEmployee(tenantOwnerId, employeePayload);
      return res.status(201).json({
        message: 'Employee added successfully.',
        employee: await attachViewPageNames(employee),
      });
    }

    const employee = await createEmployee(employeePayload);

    res.status(201).json({
      message: 'Employee added successfully.',
      employee: await attachViewPageNames(employee),
    });
  } catch (error) {
    console.error('Add Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// get all employees by user
export const getEmployees = async (req, res) => {
  try {
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    if (!tenantOwnerId) {
      return res.status(401).json({ message: 'Authenticated user not found.' });
    }

    const clientWorkspace = await isClientWorkspaceUser(tenantOwnerId);
    const employees = clientWorkspace
      ? await getTenantEmployeesByUser(tenantOwnerId)
      : await getEmployeesByUser(tenantOwnerId);
    res.status(200).json(await attachViewPageNames(employees));
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// get single employee by id
export const getSingleEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const employee =
      tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)
        ? await getTenantEmployeeById(tenantOwnerId, id)
        : await getEmployeeById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.status(200).json(await attachViewPageNames(employee));
  } catch (error) {
    console.error('Get Single Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// edit employee
export const editEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const { tenantOwnerId } = resolveTenantRequestContext(req);

    // Handle image update if present
    if (req.file) {
      updatedData.image = req.file.filename;
    }

    // Ensure viewPages is a valid JSON string
    if (updatedData.viewPages !== undefined) {
      try {
        updatedData.viewPages = parseViewPagesInput(updatedData.viewPages);
        if (!Array.isArray(updatedData.viewPages)) {
          return res.status(400).json({ message: 'viewPages must be an array.' });
        }
      } catch (err) {
        console.error('Invalid viewPages format:', err);
        return res.status(400).json({ message: 'Invalid viewPages format. Please provide a valid JSON array.' });
      }
    }

    const employee =
      tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)
        ? await updateTenantEmployee(tenantOwnerId, id, {
            ...updatedData,
            userId: tenantOwnerId,
          })
        : await updateEmployee(id, updatedData);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    res.status(200).json({
      message: 'Employee updated successfully.',
      employee: await attachViewPageNames(employee),
    });
  } catch (error) {
    console.error('Edit Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};



// delete employee
export const removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantOwnerId } = resolveTenantRequestContext(req);
    const deleted =
      tenantOwnerId && await isClientWorkspaceUser(tenantOwnerId)
        ? await deleteTenantEmployee(tenantOwnerId, id)
        : await deleteEmployee(id);
    if (!deleted) return res.status(404).json({ message: 'Employee not found.' });
    res.status(200).json({ message: 'Employee deleted.', employee: deleted });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

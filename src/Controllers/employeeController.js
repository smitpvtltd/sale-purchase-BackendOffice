import {
  createEmployee,
  getEmployeesByUser,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../Services/employeeService.js';



// add employee
export const addEmployee = async (req, res) => {
  try {
    const {
      name,
      contact,
      email,
      address,
      firmId,
      userName,
      password,
      userId,
      viewPages,
    } = req.body;

    if (!name || !contact || !email || !address || !firmId || !userName || !password || !userId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const image = req.file?.filename;
    const employee = await createEmployee({
      name,
      contact,
      email,
      address,
      image,
      firmId,
      userName,
      password,
      userId,
      viewPages: JSON.parse(viewPages),
    });

    res.status(201).json({ message: 'Employee added successfully.', employee });
  } catch (error) {
    console.error('Add Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// get all employees by user
export const getEmployees = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required.' });
    }

    const employees = await getEmployeesByUser(userId);
    res.status(200).json(employees);
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// get single employee by id
export const getSingleEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await getEmployeeById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.status(200).json(employee);
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

    // Handle image update if present
    if (req.file) {
      updatedData.image = req.file.filename;
    }

    if (updatedData.viewPages) {
      updatedData.viewPages = JSON.parse(updatedData.viewPages);
    }

    const employee = await updateEmployee(id, updatedData);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    res.status(200).json({ message: 'Employee updated successfully.', employee });
  } catch (error) {
    console.error('Edit Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// delete employee
export const removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteEmployee(id);
    if (!deleted) return res.status(404).json({ message: 'Employee not found.' });
    res.status(200).json({ message: 'Employee deleted.', employee: deleted });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

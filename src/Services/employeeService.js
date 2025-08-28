import Employee from '../Models/employeeModel.js';


// add employee 
export const createEmployee = async (employeeData) => {
  return await Employee.create(employeeData);
};

// get all employees
export const getEmployeesByUser = async (userId) => {
  return await Employee.findAll({
    where: { userId },
    order: [['id', 'DESC']],
  });
};


// get employee by id
export const getEmployeeById = async (id) => {
  return await Employee.findByPk(id);
};

// update employee
export const updateEmployee = async (id, updateData) => {
  const employee = await getEmployeeById(id);
  if (!employee) return null;

  await employee.update(updateData);
  return employee;
};

// delete employee
export const deleteEmployee = async (id) => {
  const employee = await getEmployeeById(id);
  if (!employee) return null;

  await employee.destroy();
  return employee;
};

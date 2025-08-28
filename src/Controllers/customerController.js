import {
  createCustomerService,
  getAllCustomersService,
  updateCustomerService,
  deleteCustomerService
} from '../Services/customerService.js';

export const createCustomer = async (req, res) => {
  const { name, email, mobile, address, state, city, gstNumber, companyName, stateType, userId } = req.body;

  if (!name || !email || !mobile || !address || !state || !city || !stateType || !userId) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const customer = await createCustomerService({
      name,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      companyName,
      stateType,
      userId
    });

    res.status(201).json({ message: 'Customer added.', customer });
  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getCustomers = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  try {
    const customers = await getAllCustomersService(userId);
    res.status(200).json(customers);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const editCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, address, state, city, gstNumber, companyName, stateType } = req.body;

  if (!name || !email || !mobile || !address || !state || !city || !stateType) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const updatedCustomer = await updateCustomerService(id, {
      name,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      companyName,
      stateType,
    });

    if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found.' });

    res.status(200).json({ message: 'Customer updated.', customer: updatedCustomer });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const removeCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCustomer = await deleteCustomerService(id);
    if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found.' });

    res.status(200).json({ message: 'Customer deleted.', customer: deletedCustomer });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

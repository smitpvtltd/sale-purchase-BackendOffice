import {
  createCustomerService,
  getAllCustomersService,
  updateCustomerService,
  deleteCustomerService
} from '../Services/customerService.js';

// add customer 
export const createCustomer = async (req, res) => {
  try {
    const {
      name, email, mobile, address, state, city, aadharNumber, userId
    } = req.body;

    if (!name || !mobile || !userId) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const customerImg = req.files?.map(file => `uploads/customer/${file.filename}`) || [];

    const customer = await createCustomerService({
      name,
      email,
      mobile,
      address,
      state,
      city,
      aadharNumber,
      customerImg,
      userId
    });

    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// get all customers
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

// edit customer 
export const editCustomer = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // 👇 Handle updated images
    if (req.files?.length > 0) {
      updatedData.customerImg = req.files.map(file => file.filename);
    }

    const updatedCustomer = await updateCustomerService(id, updatedData);

    if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found.' });

    res.status(200).json({ message: 'Customer updated.', customer: updatedCustomer });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// delete customer
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

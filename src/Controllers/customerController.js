import {
  createCustomerService,
  getAllCustomersService,
  updateCustomerService,
  deleteCustomerService,
} from "../Services/customerService.js";
import Customer from "../Models/customerModel.js";
import { safeLogAudit } from "../Services/auditLogService.js";

const getCustomerAuditSnapshot = (customer) => ({
  id: customer.id,
  name: customer.name,
  firmId: customer.firmId,
  email: customer.email,
  mobile: customer.mobile,
  address: customer.address,
  state: customer.state,
  city: customer.city,
  gstNumber: customer.gstNumber,
  accountName: customer.accountName,
  bankName: customer.bankName,
  accountNumber: customer.accountNumber,
  ifscCode: customer.ifscCode,
  customerImg: customer.customerImg,
  userId: customer.userId,
});

// add customer
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      firmId,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      accountName,
      bankName,
      accountNumber,
      ifscCode,
      userId,
    } = req.body;

    if (!name || !mobile || !userId) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const customerImg =
      req.files?.map((file) => `uploads/customer/${file.filename}`) || [];

    const customer = await createCustomerService({
      name,
      firmId,
      email,
      mobile,
      address,
      state,
      city,
      gstNumber,
      accountName,
      bankName,
      accountNumber,
      ifscCode,
      customerImg,
      userId,
    });

    res
      .status(201)
      .json({ message: "Customer created successfully", customer });

    await safeLogAudit({
      module: "CUSTOMER",
      entityId: customer.id,
      action: "CREATE",
      oldValue: null,
      newValue: getCustomerAuditSnapshot(customer),
      userId: customer.userId,
      metadata: { firmId: customer.firmId },
    });
  } catch (error) {
    console.error("Create Customer Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// get all customers
export const getCustomers = async (req, res) => {
  const { userId, firmId } = req.query;

  if (!userId || !firmId) {
    return res
      .status(400)
      .json({ message: "userId and firmId are required." });
  }

  try {
    const customers = await getAllCustomersService(userId, firmId);
    res.status(200).json(customers);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// edit customer
export const editCustomer = async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    if (
      Object.prototype.hasOwnProperty.call(updatedData, "aadharNumber") &&
      !Object.prototype.hasOwnProperty.call(updatedData, "gstNumber")
    ) {
      delete updatedData.aadharNumber;
    }

    const previousCustomer = await Customer.findByPk(id);

    if (req.files?.length > 0) {
      updatedData.customerImg = req.files.map(
        (file) => `uploads/customer/${file.filename}`,
      );
    }

    const updatedCustomer = await updateCustomerService(id, updatedData);

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res
      .status(200)
      .json({ message: "Customer updated.", customer: updatedCustomer });

    await safeLogAudit({
      module: "CUSTOMER",
      entityId: updatedCustomer.id,
      action: "UPDATE",
      oldValue: previousCustomer ? getCustomerAuditSnapshot(previousCustomer) : null,
      newValue: getCustomerAuditSnapshot(updatedCustomer),
      userId: updatedCustomer.userId,
      metadata: { firmId: updatedCustomer.firmId },
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// delete customer
export const removeCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCustomer = await deleteCustomerService(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    res
      .status(200)
      .json({ message: "Customer deleted.", customer: deletedCustomer });

    await safeLogAudit({
      module: "CUSTOMER",
      entityId: deletedCustomer.id,
      action: "DELETE",
      oldValue: getCustomerAuditSnapshot(deletedCustomer),
      newValue: null,
      userId: deletedCustomer.userId,
      metadata: { firmId: deletedCustomer.firmId },
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

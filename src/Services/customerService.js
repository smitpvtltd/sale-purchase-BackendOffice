import Customer from '../Models/customerModel.js';
import City from '../Models/cityModel.js';
import State from '../Models/stateModel.js';

export const createCustomerService = async (data) => {
  return await Customer.create(data);
};

export const getAllCustomersService = async (userId, firmId) => {
  const where = { userId };

  if (firmId) {
    where.firmId = firmId;
  }

  return await Customer.findAll({
    where,
    order: [['id', 'DESC']],
    include: [
      {
        model: State,
        attributes: ['id','statename'],
      },
      {
        model: City,
        attributes: ['id', 'citynm'],
      },
    ],
    attributes: [
      'id',
      'name',
      'firmId',
      'email',
      'mobile',
      'address',
      'state',
      'city',
      'gstNumber',
      'accountName',
      'bankName',
      'accountNumber',
      'ifscCode',
      'customerImg',
      'userId',
    ],
  });
};


export const updateCustomerService = async (id, data) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;
  return await customer.update(data);
};

export const deleteCustomerService = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;
  await customer.destroy();
  return customer;
};

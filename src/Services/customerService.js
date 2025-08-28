import Customer from '../Models/customerModel.js';
import City from '../Models/cityModel.js';
import State from '../Models/stateModel.js';

export const createCustomerService = async (data) => {
  return await Customer.create(data);
};

export const getAllCustomersService = async (userId) => {
  return await Customer.findAll({
    where: { userId },
    order: [['id', 'ASC']],
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
      'email',
      'mobile',
      'address',
      'gstNumber',
      'companyName',
      'stateType',
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

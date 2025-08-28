import Firm from '../Models/firmModel.js';
import User from '../Models/userModel.js';

export const createFirm = async (firmData) => {
  return await Firm.create(firmData);
};

//get all firms by userId & get all firms
export const getAllFirms = async (userId) => {
  const query = {
    order: [['id', 'DESC']],
    include: [
      {
        model: User,
        attributes: ['id', 'visiblePassword'] // or 'password' if you're storing it that way
      }
    ]
  };

  if (userId) {
    query.where = { userId };
  }

  return await Firm.findAll(query);
};


export const getFirmById = async (id) => {
  return await Firm.findByPk(id);
};

export const updateFirm = async (id, updateData) => {
  const firm = await getFirmById(id);
  if (!firm) return null;
  await firm.update(updateData);
  return firm;
};

// export const deleteFirm = async (id) => {
//   const firm = await getFirmById(id);
//   if (!firm) return null;
//   await firm.destroy();
//   return firm;
// };
export const deleteFirm = async (id) => {
  const firm = await getFirmById(id);
  if (!firm) return null;

  try {
    await firm.destroy();
    return firm;
  } catch (err) {
    console.error('❌ Delete Firm Error:', err); // <== This will help you debug
    throw err; // Re-throw so the controller catches it
  }
};

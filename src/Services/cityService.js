import City from '../Models/cityModel.js';

export const getCitiesByStateId = async (stateId) => {
  return await City.findAll({
    where: { stateId: Number(stateId) },  
    order: [['citynm', 'ASC']]            
  });
};

import State from '../Models/stateModel.js';

export const getAllStates = async () => {
  return await State.findAll({ order: [['statename', 'ASC']] });
};

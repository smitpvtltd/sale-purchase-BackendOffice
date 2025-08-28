import { getAllStates } from '../Services/stateService.js';

export const fetchStates = async (req, res) => {
  try {
    const states = await getAllStates();
    res.status(200).json(states);
  } catch (err) {
    console.error('Error fetching states:', err);
    res.status(500).json({ message: 'Failed to load states' });
  }
};

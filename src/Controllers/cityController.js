import { getCitiesByStateId } from '../Services/cityService.js';



export const fetchCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    console.log("Requested stateId:", stateId);

    const cities = await getCitiesByStateId(stateId);
    console.log("Fetched cities:", cities);

    res.status(200).json(cities);
  } catch (err) {
    console.error('Error fetching cities:', err); // Full error stack
    res.status(500).json({ message: 'Failed to load cities' });
  }
};

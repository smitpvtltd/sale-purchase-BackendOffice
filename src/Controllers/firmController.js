import {
  createFirm,
  getAllFirms,
  getFirmById,
  updateFirm,
  deleteFirm
} from '../Services/firmService.js';
import bcrypt from 'bcrypt';
import User from '../Models/userModel.js'; // Import User model
import { createUser, findUserByUsername } from '../Services/userService.js';



// controllers/firmController.js
export const addFirm = async (req, res) => {
  try {
    const firmData = { ...req.body };
    const { firmUsername, firmPassword } = firmData;

    let userId;

    // ✅ Step 1: Create user if username & password provided
    if (firmUsername && firmPassword) {
      const existingUser = await findUserByUsername(firmUsername);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(firmPassword, 10);

      const newUser = await createUser(
        firmUsername,
        hashedPassword,
        'admin',       // default role
        firmPassword   // visiblePassword
      );

      userId = newUser.id;
    } 
    // ✅ Step 2: Fallback to existing userId if provided
    else if (firmData.userId) {
      userId = firmData.userId;
    } 
    // ❌ Step 3: Reject if neither provided
    else {
      return res.status(400).json({ message: 'User credentials or userId required.' });
    }

    // ✅ Step 4: Handle file upload (firm logo)
    if (req.file) {
      firmData.firmLogo = req.file.filename;
    }

    // ✅ Step 5: Assign userId to firm
    firmData.userId = userId;

    // ✅ Step 6: Create firm
    const firm = await createFirm(firmData);

    res.status(201).json({ message: 'Firm and user created successfully.', firm });
  } catch (error) {
    console.error('Add Firm Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

  // get firms by userId & all firms
export const getFirms = async (req, res) => {
  try {
    const { userId } = req.query;

    let firms;
    if (userId) {
      firms = await getAllFirms(userId); // Filtered
    } else {
      firms = await getAllFirms(); // All
    }

    res.status(200).json(firms);
  } catch (error) {
    console.error('Get Firms Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const getSingleFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const firm = await getFirmById(id);
    if (!firm) return res.status(404).json({ message: 'Firm not found.' });
    res.status(200).json(firm);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const editFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.firmLogo = req.file.filename;
    }

    const firm = await updateFirm(id, updatedData);
    if (!firm) return res.status(404).json({ message: 'Firm not found.' });

    res.status(200).json({ message: 'Firm updated successfully.', firm });
  } catch (error) {
    console.error('Edit Firm Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// export const removeFirm = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await deleteFirm(id);
//     if (!deleted) return res.status(404).json({ message: 'Firm not found.' });
//     res.status(200).json({ message: 'Firm deleted.', firm: deleted });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error.' });
//   }
// };
export const removeFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFirm(id);
    if (!deleted) return res.status(404).json({ message: 'Firm not found.' });

    res.status(200).json({ message: 'Firm deleted.', firm: deleted });
  } catch (error) {
    console.error('❌ Remove Firm Controller Error:', error); // <== More detailed log
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
};

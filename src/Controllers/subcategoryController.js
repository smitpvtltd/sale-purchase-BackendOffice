import {
  addSubcategory,
  getAllSubcategories,
  findSubcategoryByName,
  findSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from '../Services/subcategoryService.js';

// Add Subcategory
export const createSubcategory = async (req, res) => {
  const { subCatNm, categoryId } = req.body;

  if (!subCatNm || !categoryId) {
    return res.status(400).json({ message: 'Subcategory name and categoryId are required.' });
  }

  try {
    const existing = await findSubcategoryByName(subCatNm, categoryId);
    if (existing) {
      return res.status(409).json({ message: 'Subcategory already exists for this category.' });
    }

    const subcategory = await addSubcategory(subCatNm, categoryId);
    return res.status(201).json({ message: 'Subcategory added.', subcategory });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Get Subcategories
export const getSubcategories = async (req, res) => {
  const { categoryId } = req.query;

  if (!categoryId) {
    return res.status(400).json({ message: 'categoryId is required.' });
  }

  try {
    const subcategories = await getAllSubcategories(categoryId);
    return res.status(200).json(subcategories);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Edit Subcategory
export const editSubcategory = async (req, res) => {
  const { id } = req.params;
  const { subCatNm } = req.body;

  if (!subCatNm) {
    return res.status(400).json({ message: 'New subcategory name required.' });
  }

  try {
    const subcategoryToUpdate = await findSubcategoryById(id);
    if (!subcategoryToUpdate) {
      return res.status(404).json({ message: 'Subcategory not found.' });
    }

    // Check for name conflict within the same category
    const existing = await findSubcategoryByName(subCatNm, subcategoryToUpdate.categoryId);
    if (existing && existing.id !== parseInt(id, 10)) {
      return res.status(409).json({ message: 'Another subcategory with this name already exists under the same category.' });
    }

    const updated = await updateSubcategory(id, subCatNm);
    return res.status(200).json({ message: 'Subcategory updated.', subcategory: updated });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// Delete Subcategory
export const removeSubcategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteSubcategory(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Subcategory not found.' });
    }
    return res.status(200).json({ message: 'Subcategory deleted.', subcategory: deleted });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

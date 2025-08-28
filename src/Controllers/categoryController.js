import {
  addCategory,
  getAllCategories,
  findCategoryById,
  findCategoryByName,
  updateCategory,
  deleteCategory
} from '../Services/categoryService.js';

// Add Category
export const createCategory = async (req, res) => {
  const { catNm, userId } = req.body;

  if (!catNm || !userId) {
    return res.status(400).json({ message: 'Category name and userId are required.' });
  }

  try {
    const existing = await findCategoryByName(catNm, userId);
    if (existing) {
      return res.status(409).json({ message: 'Category already exists for this user.' });
    }

    const category = await addCategory(catNm, userId);
    res.status(201).json({ message: 'Category added.', category });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get Categories
export const getCategories = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  try {
    const categories = await getAllCategories(userId);
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};



// Edit Category
export const editCategory = async (req, res) => {
  const { id } = req.params;
  const { catNm } = req.body;

  if (!catNm) {
    return res.status(400).json({ message: 'New category name required.' });
  }

  try {
    const updated = await updateCategory(id, catNm);
    if (!updated) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category updated.', category: updated });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete Category
export const removeCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category deleted.', category: deleted });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

import {
  addCategory,
  getAllCategories,
  findCategoryById,
  findCategoryByName,
  updateCategory,
  deleteCategory
} from '../Services/categoryService.js';
import {
  createTenantCategory,
  deleteTenantCategory,
  findTenantCategoryByName,
  getTenantCategories,
  isClientWorkspaceUser,
  updateTenantCategory,
} from "../Services/tenantDbService.js";

// Add Category
export const createCategory = async (req, res) => {
  const { catNm } = req.body;
  const userId = req.user?.id || req.body.userId;

  if (!catNm || !userId) {
    return res.status(400).json({ message: 'Category name and userId are required.' });
  }

  try {
    const existing = await (
      await isClientWorkspaceUser(userId)
        ? findTenantCategoryByName(userId, catNm)
        : findCategoryByName(catNm, userId)
    );
    if (existing) {
      return res.status(409).json({ message: 'Category already exists for this user.' });
    }

    const category = await (
      await isClientWorkspaceUser(userId)
        ? createTenantCategory(userId, catNm)
        : addCategory(catNm, userId)
    );
    res.status(201).json({ message: 'Category added.', category });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get Categories
export const getCategories = async (req, res) => {
  const userId = req.user?.id || req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  try {
    const categories = await (
      await isClientWorkspaceUser(userId)
        ? getTenantCategories(userId)
        : getAllCategories(userId)
    );
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
    const userId = req.user?.id || req.body.userId || req.query.userId;
    const updated = await (
      userId && await isClientWorkspaceUser(userId)
        ? updateTenantCategory(userId, id, catNm)
        : updateCategory(id, catNm)
    );
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
    const userId = req.user?.id || req.query.userId;
    const deleted = await (
      userId && await isClientWorkspaceUser(userId)
        ? deleteTenantCategory(userId, id)
        : deleteCategory(id)
    );
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.status(200).json({ message: 'Category deleted.', category: deleted });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

import {
  addSubcategory,
  getAllSubcategories,
  findSubcategoryByName,
  findSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from '../Services/subcategoryService.js';
import {
  createTenantSubcategory,
  deleteTenantSubcategory,
  findTenantSubcategoryByName,
  getTenantSubcategories,
  getTenantSubcategoryById,
  isClientWorkspaceUser,
  updateTenantSubcategory,
} from "../Services/tenantDbService.js";

// Add Subcategory
export const createSubcategory = async (req, res) => {
  const { subCatNm, categoryId } = req.body;

  if (!subCatNm || !categoryId) {
    return res.status(400).json({ message: 'Subcategory name and categoryId are required.' });
  }

  try {
    const userId = req.user?.id || req.body.userId || req.query.userId;
    const existing = await (
      userId && await isClientWorkspaceUser(userId)
        ? findTenantSubcategoryByName(userId, subCatNm, categoryId)
        : findSubcategoryByName(subCatNm, categoryId)
    );
    if (existing) {
      return res.status(409).json({ message: 'Subcategory already exists for this category.' });
    }

    const subcategory = await (
      userId && await isClientWorkspaceUser(userId)
        ? createTenantSubcategory(userId, subCatNm, categoryId)
        : addSubcategory(subCatNm, categoryId)
    );
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
    const userId = req.user?.id || req.query.userId;
    const subcategories = await (
      userId && await isClientWorkspaceUser(userId)
        ? getTenantSubcategories(userId, categoryId)
        : getAllSubcategories(categoryId)
    );
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
    const userId = req.user?.id || req.body.userId || req.query.userId;
    const subcategoryToUpdate = await (
      userId && await isClientWorkspaceUser(userId)
        ? getTenantSubcategoryById(userId, id)
        : findSubcategoryById(id)
    );
    if (!subcategoryToUpdate) {
      return res.status(404).json({ message: 'Subcategory not found.' });
    }

    // Check for name conflict within the same category
    const existing = await (
      userId && await isClientWorkspaceUser(userId)
        ? findTenantSubcategoryByName(userId, subCatNm, subcategoryToUpdate.categoryId)
        : findSubcategoryByName(subCatNm, subcategoryToUpdate.categoryId)
    );
    if (existing && existing.id !== parseInt(id, 10)) {
      return res.status(409).json({ message: 'Another subcategory with this name already exists under the same category.' });
    }

    const updated = await (
      userId && await isClientWorkspaceUser(userId)
        ? updateTenantSubcategory(userId, id, subCatNm)
        : updateSubcategory(id, subCatNm)
    );
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
    const userId = req.user?.id || req.query.userId;
    const deleted = await (
      userId && await isClientWorkspaceUser(userId)
        ? deleteTenantSubcategory(userId, id)
        : deleteSubcategory(id)
    );
    if (!deleted) {
      return res.status(404).json({ message: 'Subcategory not found.' });
    }
    return res.status(200).json({ message: 'Subcategory deleted.', subcategory: deleted });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

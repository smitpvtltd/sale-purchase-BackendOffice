import Subcategory from '../Models/subcategoryModel.js';

export const addSubcategory = async (subCatNm, categoryId) => {
  return await Subcategory.create({ subCatNm, categoryId });
};

export const getAllSubcategories = async (categoryId) => {
  return await Subcategory.findAll({
    where: { categoryId },
    order: [['id', 'DESC']],
  });
};

export const findSubcategoryByName = async (subCatNm, categoryId) => {
  return await Subcategory.findOne({ where: { subCatNm, categoryId } });
};

export const findSubcategoryById = async (id) => {
  return await Subcategory.findByPk(id);
};

export const updateSubcategory = async (id, subCatNm) => {
  const subcategory = await findSubcategoryById(id);
  if (!subcategory) return null;

  subcategory.subCatNm = subCatNm;
  await subcategory.save();

  return subcategory;
};

export const deleteSubcategory = async (id) => {
  const subcategory = await findSubcategoryById(id);
  if (!subcategory) return null;

  await subcategory.destroy();

  return subcategory;
};

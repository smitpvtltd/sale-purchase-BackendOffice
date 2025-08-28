import Category from '../Models/categoryModel.js';

export const addCategory = async (catNm, userId) => {
  return await Category.create({ catNm, userId });
};

export const getAllCategories = async (userId) => {
  return await Category.findAll({
    where: { userId },
    order: [['id', 'ASC']],
  });
};

export const findCategoryByName = async (catNm, userId) => {
  return await Category.findOne({ where: { catNm, userId } });
};


export const findCategoryById = async (id) => {
  return await Category.findByPk(id);
};

export const updateCategory = async (id, catNm) => {
  const category = await findCategoryById(id);
  if (!category) return null;
  category.catNm = catNm;
  await category.save();
  return category;
};

export const deleteCategory = async (id) => {
  const category = await findCategoryById(id);
  if (!category) return null;
  await category.destroy();
  return category;
};

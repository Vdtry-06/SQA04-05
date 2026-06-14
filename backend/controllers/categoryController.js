const categoryModel = require("../models/categoryModel");

// Lấy tất cả categories
async function getAllCategories(req, res, next) {
  try {
    const categories = await categoryModel.findAll();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

// Lấy category theo ID
async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// Tạo category mới
async function createCategory(req, res, next) {
  try {
    const { name, parent_id } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    const result = await categoryModel.create(name, parent_id || null);
    res.json({
      success: true,
      message: "Category created successfully",
      categoryId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

// Cập nhật category
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    const result = await categoryModel.update(id, name, parent_id || null);
    res.json({
      success: true,
      message: "Category updated successfully",
      affectedRows: result.affectedRows || 0,
    });
  } catch (err) {
    next(err);
  }
}

// Xóa category
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await categoryModel.deleteCategory(id);
    res.json({
      success: true,
      message: "Category deleted successfully",
      affectedRows: result.affectedRows || 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

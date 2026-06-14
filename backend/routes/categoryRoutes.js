
const express = require('express');
const categoryCtrl = require('../controllers/categoryController');

const router = express.Router();

// GET /api/categories - Lấy tất cả categories
router.get('/', categoryCtrl.getAllCategories);

// GET /api/categories/:id - Lấy category theo ID
router.get('/:id', categoryCtrl.getCategoryById);

// POST /api/categories - Tạo category mới
router.post('/', categoryCtrl.createCategory);

// PUT /api/categories/:id - Cập nhật category
router.put('/:id', categoryCtrl.updateCategory);

// DELETE /api/categories/:id - Xóa category
router.delete('/:id', categoryCtrl.deleteCategory);

module.exports = router;


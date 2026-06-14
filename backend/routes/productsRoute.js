
const express = require('express');
const productCtrl = require('../controllers/productController');

const router = express.Router();

// ===== PUBLIC ROUTES (Trang chủ + Trang sản phẩm) =====
// GET /api/products/allProducts - Lấy tất cả sản phẩm active
router.get('/allProducts', productCtrl.allProducts);

// GET /api/products/detailProduct/:productId - Lấy chi tiết sản phẩm
router.get('/detailProduct/:productId', productCtrl.detailProduct);

// GET /api/products/productByType/:type - Lấy sản phẩm theo category
router.get('/productByType/:type', productCtrl.productByType);

// POST /api/products/productByName - Tìm kiếm sản phẩm theo tên
router.post('/productByName', productCtrl.productByName);

// ===== ADMIN ROUTES =====
// GET /api/products/getAllProducts - Lấy tất cả sản phẩm (bao gồm inactive)
router.get('/getAllProducts', productCtrl.getAllProducts);

// PUT /api/products/updateProduct/:productId - Cập nhật sản phẩm
router.put('/updateProduct/:productId', productCtrl.updateProduct);

// POST /api/products/deleteProduct/:productId - Xóa sản phẩm
router.post('/deleteProduct/:productId', productCtrl.deleteProduct);
router.delete('/deleteProduct/:productId', productCtrl.deleteProduct);

// DELETE /api/products/deleteVariant/:variantId - Xóa variant sản phẩm
router.delete('/deleteVariant/:variantId', productCtrl.deleteVariant);

// POST /api/products/createProduct - Tạo sản phẩm mới
router.post('/createProduct', productCtrl.createProduct);
module.exports = router;

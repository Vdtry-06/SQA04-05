const productModel = require('../models/productModel');

// Lấy tất cả sản phẩm (admin)
async function getAllProducts() {
  const rows = await productModel.findAllWithVariants();
  return rows;
}

// Lấy tất cả sản phẩm active (trang chủ + trang sản phẩm)
async function getAllActiveProducts() {
  const rows = await productModel.findAllActive();
  return rows;
}

// Lấy chi tiết sản phẩm
async function getProductDetail(id) {
  return await productModel.findByIdWithVariants(id);
}

// Lấy sản phẩm theo category
async function getProductsByCategory(categoryId) {
  return await productModel.findByCategory(categoryId);
}

// Tìm kiếm sản phẩm theo tên
async function searchProductByName(name) {
  return await productModel.findByName(name);
}

// Lấy sản phẩm theo ID (không có variants)
async function getProductById(id) {
  return await productModel.findById(id);
}

// Cập nhật sản phẩm
async function updateProduct(id, data) {
  return await productModel.updateWithVariants(id, data);
}

// Xóa sản phẩm
async function deleteProduct(id) {
  return await productModel.removeWithVariants(id);
}
// Xóa variant theo ID
async function deleteVariant(variantId) {
  return await productModel.deleteVariantById(variantId);
}
// Tạo sản phẩm mới
async function createProduct(data) {
  return await productModel.createWithVariants(data);
}

module.exports = {
  getAllProducts,
  getAllActiveProducts,
  getProductDetail,
  getProductsByCategory,
  searchProductByName,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteVariant,
  createProduct
};
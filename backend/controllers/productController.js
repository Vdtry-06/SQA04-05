const productService = require('../services/productService.js');
const { updateProductInRAG, deleteProductFromRAG } = require('../services/ragService.js');

// Lấy tất cả sản phẩm (trang chủ + trang sản phẩm)
async function allProducts(req, res, next) {
  try {
    const rows = await productService.getAllActiveProducts();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// Lấy chi tiết sản phẩm
async function detailProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await productService.getProductDetail(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

// Lấy sản phẩm theo category
async function productByType(req, res, next) {
  try {
    const { type } = req.params;
    const products = await productService.getProductsByCategory(type);
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
}

// Tìm kiếm sản phẩm theo tên
async function productByName(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const products = await productService.searchProductByName(name);
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
}

// Lấy tất cả sản phẩm (admin)
async function getAllProducts(req, res, next) {
  try {
    const rows = await productService.getAllProducts();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// Cập nhật sản phẩm
async function updateProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const payload = { ...req.body };

    if (payload.images && typeof payload.images === 'string') {
      try { payload.images = JSON.parse(payload.images); } catch { /* keep string */ }
    }
    if (payload.variants && typeof payload.variants === 'string') {
      try { payload.variants = JSON.parse(payload.variants); } catch { payload.variants = []; }
    }

    await productService.updateProduct(productId, payload);
    
    // Fire & forget: Update product in RAG vector DB in background
    updateProductInRAG(productId).catch(err => {
      console.error('[Product Controller] RAG update failed:', err.message);
    });
    
    res.json({ success: true, message: 'Product updated' });
  } catch (err) { next(err); }
}

// Xóa sản phẩm
async function deleteProduct(req, res, next) {
  try {
    const { productId } = req.params;
    await productService.deleteProduct(productId);
    
    // Fire & forget: Remove product from RAG vector DB in background
    deleteProductFromRAG(productId).catch(err => {
      console.error('[Product Controller] RAG delete failed:', err.message);
    });
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
}

// Xoá variant sản phẩm
async function deleteVariant(req, res, next) {
  try {
    const variantId = Number(req.params.variantId);
    if (!variantId) {
      return res.status(400).json({ success: false, message: 'Invalid variant id' });
    }
    await productService.deleteVariant(variantId);
    res.json({ success: true, message: 'Variant deleted' });
  } catch (err) { next(err); }
}
// Tạo sản phẩm mới (admin)
async function createProduct(req, res, next) {
  try {
    const payload = { ...req.body };

    if (payload.images && typeof payload.images === 'string') {
      try { payload.images = JSON.parse(payload.images); } catch { /* keep string */ }
    }
    if (payload.variants && typeof payload.variants === 'string') {
      try { payload.variants = JSON.parse(payload.variants); } catch { payload.variants = []; }
    }

    const result = await productService.createProduct(payload);
    
    // Fire & forget: Add new product to RAG vector DB in background
    if (result && result.id) {
      updateProductInRAG(result.id).catch(err => {
        console.error('[Product Controller] RAG index failed:', err.message);
      });
    }
    
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

module.exports = {
  allProducts,
  detailProduct,
  productByType,
  productByName,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteVariant
};
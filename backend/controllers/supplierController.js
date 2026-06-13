const supplierModel = require('../models/supplierModel');

// Lấy tất cả suppliers
async function getAllSuppliers(req, res, next) {
  try {
    const suppliers = await supplierModel.findAll();
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

// Lấy supplier theo ID
async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await supplierModel.findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllSuppliers,
  getSupplierById
};
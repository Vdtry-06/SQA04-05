const express = require('express');
const supplierCtrl = require('../controllers/supplierController');

const router = express.Router();

// GET /api/suppliers/all - Lấy tất cả suppliers
router.get('/all', supplierCtrl.getAllSuppliers);

// GET /api/suppliers/:id - Lấy supplier theo ID
router.get('/:id', supplierCtrl.getSupplierById);

module.exports = router;
const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/reportController');

// optional: you can protect routes with authenticateToken middleware if needed
// const { authenticateToken } = require('../middlewares/authenticateToken');

router.get('/revenue-summary', reportCtrl.revenueSummary);
router.get('/top-products', reportCtrl.topProducts);
router.get('/revenue-by-month', reportCtrl.revenueByMonth);
router.get('/top-buyers', reportCtrl.topBuyers);

module.exports = router;
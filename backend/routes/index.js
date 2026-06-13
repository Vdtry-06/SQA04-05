const express = require('express');
const router = express.Router();

router.use('/users', require('./usersRoute'));
router.use('/products', require('./productsRoute'));
router.use('/orders', require('./ordersRoute'));
router.use('/payments', require('./paymentsRoute'));
router.use('/cart', require('./cartRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/auth', require('./authRoute'));
router.use('/reports', require('./reportsRoute'));
router.use('/blogs', require('./blogRoutes'));
router.use('/contact', require('./contactRoutes'));

module.exports = router;
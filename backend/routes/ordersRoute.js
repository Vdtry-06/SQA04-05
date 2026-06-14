const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();

// Thanh toán và đơn hàng (Customer)
router.get('/checkout/:cartId', OrderController.getCheckoutInfo);
router.post('/createOrder', OrderController.createOrder);
router.get('/orderDetail/:orderId', OrderController.getOrderDetail);
router.get('/myOrders/:userId', OrderController.getMyOrders);
router.put('/cancelOrder/:orderId', OrderController.cancelOrder);
router.put('/updatePaymentStatus/:orderId', OrderController.updatePaymentStatus);

// Admin
router.get('/getAllOrder', OrderController.getAllOrders);
router.put('/updateOrder/:orderId', OrderController.updateOrder);
router.post('/search', OrderController.searchOrders);

module.exports = router;
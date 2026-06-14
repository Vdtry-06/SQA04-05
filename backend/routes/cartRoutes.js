const express = require('express');
const CartController = require('../controllers/cartController');

const router = express.Router();

// Giỏ hàng
router.post('/addItem', CartController.addItem);
router.get('/viewCart/:userId', CartController.viewCart);
router.put('/updateItem/:cartItemId', CartController.updateItem);
router.delete('/removeItem/:cartItemId', CartController.removeItem);
router.delete('/clearCart/:cartId', CartController.clearCart);
router.post('/restore-from-order', CartController.restoreCartFromUnpaidOrder);

module.exports = router;
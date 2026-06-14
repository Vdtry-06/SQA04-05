const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const ReviewController = require('../controllers/reviewController');

// Public: list reviews for a product
router.get('/product/:productId', ReviewController.getProductReviews);

// Protected: check if current user can review this product
router.get('/canReview/:productId', authenticateToken, ReviewController.getCanReview);

// Protected: create or update a review for a product
router.post('/', authenticateToken, ReviewController.createOrUpdateReview);


// Protected: create or update a review from an order context
router.post('/fromOrder', authenticateToken, ReviewController.createOrUpdateReviewFromOrder);

// Protected: get per-order review status (window + per-item reviewed)
router.get('/order/:orderId/status', authenticateToken, ReviewController.getOrderReviewStatus);

module.exports = router;


const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authenticateToken = require('../middlewares/authenticateToken');

// Public - gửi liên hệ
router.post('/send', contactController.sendRequest);

// Admin - xem tất cả
router.get('/', authenticateToken, contactController.getAllRequests);

// Admin - xem chi tiết
router.get('/:id', authenticateToken, contactController.getRequestById);

// Admin - xóa
router.delete('/:id', authenticateToken, contactController.deleteRequest);

// Admin - cập nhật status
router.patch('/:id/status', authenticateToken, contactController.updateStatus);

module.exports = router;

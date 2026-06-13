const express = require('express');
const PaymentController = require('../controllers/paymentController');

const router = express.Router();

// Tạo URL thanh toán QR sử dụng thư viện VNPay
router.post('/create-qr', PaymentController.createQRPayment);

// Verify thanh toán VNPay và tạo đơn hàng
router.post('/verify-and-create-order', PaymentController.verifyAndCreateOrder);

// Cập nhật payment status sau khi verify từ VNPay
router.post('/update-payment-status', PaymentController.updatePaymentStatus);

// Callback từ VNPay sau khi thanh toán
router.get('/check-payment-vnpay', PaymentController.checkPaymentVNPay);

module.exports = router;

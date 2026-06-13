const VNPayService = require('../services/vnpayService');
const OrderService = require('../services/orderService');
const { VNPay, ignoreLogger } = require('vnpay');
const { sendOrderConfirmationEmail } = require('../config/nodemailer');
const { userModel } = require('../models');

class PaymentController {
  /**
   * Tạo URL thanh toán QR sử dụng thư viện VNPay
   * POST /api/payments/create-qr
   * Body: { orderId, amount, orderInfo?, ipAddr?, bankCode?, language? }
   */
  static async createQRPayment(req, res, next) {
    try {
      const { orderId, amount, orderInfo, ipAddr, bankCode, language } = req.body;
      
      // Validate input
      if (!orderId || !amount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: orderId, amount' 
        });
      }

      // Lấy IP của khách hàng
      const clientIpAddr = ipAddr || 
                          req.headers['x-forwarded-for'] || 
                          req.connection.remoteAddress || 
                          req.socket.remoteAddress || 
                          '127.0.0.1';

      // Gọi service để tạo URL thanh toán QR
      const result = VNPayService.createQRUrl({
        orderId,
        amount,
        orderInfo: orderInfo || `Thanh toan don hang #${orderId}`,
        ipAddr: clientIpAddr,
        bankCode: bankCode || '',
        locale: language || 'vn'
      });

      res.status(200).json({ 
        success: true, 
        message: 'QR Payment created successfully',
        data: result
      });
    } catch (error) {
      console.error('Create QR Payment error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create QR payment',
        error: error.message
      });
    }
  }

  /**
   * Xử lý callback từ VNPay (Return URL)
   * GET /api/payments/check-payment-vnpay
   */
  static async checkPaymentVNPay(req, res, next) {
    try {
      console.log('📨 VNPay Callback received:');
      console.log(req.query);

      // Khởi tạo VNPay để verify
      const vnpay = new VNPay({
        tmnCode: process.env.VNP_TMN_CODE,
        secureSecret: process.env.VNP_HASH_SECRET,
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: 'SHA512',
        enableLog: false,
        loggerFn: ignoreLogger,
      });

      // Verify return URL
      const verify = vnpay.verifyReturnUrl(req.query);
      
      console.log('🔍 Verification result:', {
        isVerified: verify.isVerified,
        isSuccess: verify.isSuccess,
        message: verify.message
      });

      if (!verify.isVerified) {
        // Redirect về frontend với error
        return res.redirect(
          `http://localhost:5173/payment/result?success=false&message=Chữ ký không hợp lệ`
        );
      }

      const paymentInfo = {
        orderId: verify.vnp_TxnRef,
        amount: verify.vnp_Amount,
        transactionNo: verify.vnp_TransactionNo,
        paymentDate: verify.vnp_PayDate,
        responseCode: verify.vnp_ResponseCode,
        isSuccess: verify.isSuccess,
        message: verify.message
      };

      console.log('✅ Payment Info:', paymentInfo);

      // Lấy order detail để tính order_number
      let orderNumber = verify.vnp_TxnRef;
      try {
        const orderDetail = await OrderService.getOrderDetail(verify.vnp_TxnRef);
        if (orderDetail && orderDetail.order_number) {
          orderNumber = orderDetail.order_number;
        }

        // Nếu thanh toán thất bại, cập nhật order status thành "cancelled"
        if (!verify.isSuccess) {
          await OrderService.updateOrderStatus(verify.vnp_TxnRef, 'cancelled');
          console.log(`✅ Order ${verify.vnp_TxnRef} status updated to cancelled`);
        }
      } catch (e) {
        console.error('Failed to get order number or update order status:', e);
      }

      // Redirect về frontend với result
      const redirectUrl = `http://localhost:5173/payment/result?success=${verify.isSuccess}&orderId=${verify.vnp_TxnRef}&orderNumber=${orderNumber}&amount=${verify.vnp_Amount}&transactionNo=${verify.vnp_TransactionNo}&message=${encodeURIComponent(verify.message)}`;
      
      console.log('🔗 Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Check payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi kiểm tra thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Verify thanh toán VNPay và tạo đơn hàng
   * POST /api/payments/verify-and-create-order
   * Body: { userId, cartId, shippingAddress, note, amount }
   */
  static async verifyAndCreateOrder(req, res, next) {
    try {
      const { userId, cartId, shippingAddress, note, amount } = req.body;

      // Validate input
      if (!userId || !cartId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, cartId, amount'
        });
      }

      // Tạo đơn hàng với payment_status = 'unpaid' (chờ thanh toán)
      const order = await OrderService.createOrder({
        userId,
        cartId,
        shippingAddress,
        paymentMethod: 'VNPAY',
        note: note || '',
        paymentStatus: 'unpaid' // Đơn hàng chờ xác nhận thanh toán
      });

      // Tạo URL thanh toán
      const paymentResult = VNPayService.createQRUrl({
        orderId: order.order_id,
        amount: amount,
        orderInfo: `Thanh toán đơn hàng #${order.order_id}`,
        ipAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1'
      });

      res.status(201).json({
        success: true,
        message: 'Order created. Proceed to VNPay payment.',
        data: {
          orderId: order.order_id,
          totalPrice: order.total_price,
          paymentUrl: paymentResult.paymentUrl
        }
      });
    } catch (error) {
      console.error('Verify and create order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order',
        error: error.message
      });
    }
  }

  /**
   * Cập nhật payment status của đơn hàng sau khi verify từ VNPay
   * POST /api/payments/update-payment-status
   * Body: { orderId, paymentStatus, transactionNo }
   */
  static async updatePaymentStatus(req, res, next) {
    try {
      const { orderId, paymentStatus, transactionNo } = req.body;

      // Validate input
      if (!orderId || !paymentStatus) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: orderId, paymentStatus'
        });
      }

      const validStatuses = ['paid', 'unpaid', 'refunded', 'failed'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }

      // Cập nhật payment status
      await OrderService.updatePaymentStatus(orderId, paymentStatus, transactionNo);

      // Nếu thanh toán thành công, cập nhật order status và gửi email
      if (paymentStatus === 'paid') {
        await OrderService.updateOrderStatus(orderId, 'confirmed');
        
        // Gửi email xác nhận đơn hàng
        try {
          const orderDetail = await OrderService.getOrderDetail(orderId);
          const user = await userModel.findById(orderDetail.user_id);
          
          if (user && user.email) {
            // Format lại order data cho email
            const orderData = {
              order_number: orderDetail.order_number,
              id: orderDetail.id,
              total_price: orderDetail.total_price,
              items: orderDetail.order_items || [],
              shipping_address: orderDetail.shipping_address,
              payment_method: orderDetail.payment_method,
              created_at: orderDetail.created_at,
              status: orderDetail.status
            };
            
            await sendOrderConfirmationEmail(user.email, orderData);
            console.log(`✅ Order confirmation email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send order confirmation email:', emailError);
          // Không throw error, chỉ log vì email không critical
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update payment status',
        error: error.message
      });
    }
  }
}

module.exports = PaymentController;

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseDiacritics = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s#]/g, ''); // Loại bỏ ký tự đặc biệt
};

const createQRUrl = (params) => {
  try {
    const { orderId, amount, orderInfo, ipAddr, bankCode, locale } = params;

    console.log('📝 Params nhận được:', { orderId, amount, orderInfo, ipAddr, locale });

    // Validate input
    if (!orderId || !amount) {
      throw new Error('Thiếu thông tin bắt buộc: orderId, amount');
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Số tiền không hợp lệ');
    }

    // Kiểm tra cấu hình VNPay
    if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET) {
      console.error('❌ Cấu hình VNPay bị thiếu');
      console.error('VNP_TMN_CODE:', process.env.VNP_TMN_CODE ? 'Có' : 'Không');
      console.error('VNP_HASH_SECRET:', process.env.VNP_HASH_SECRET ? 'Có' : 'Không');
      throw new Error('Cấu hình VNPay bị thiếu. Vui lòng kiểm tra file .env');
    }

    console.log('✓ Cấu hình VNPay hợp lệ');
    console.log('🔑 TMN_CODE:', process.env.VNP_TMN_CODE);
    console.log('🔑 HASH_SECRET:', process.env.VNP_HASH_SECRET);
    console.log('🔑 HASH_SECRET length:', process.env.VNP_HASH_SECRET.length);

    const vnpay = new VNPay({
      tmnCode: process.env.VNP_TMN_CODE,
      secureSecret: process.env.VNP_HASH_SECRET,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      enableLog: false,
      loggerFn: ignoreLogger,
    });

    console.log('✓ Khởi tạo VNPay thành công');

    // Xử lý IP address - VNPay chỉ chấp nhận IPv4
    let clientIp = ipAddr || '127.0.0.1';
    // Nếu là IPv6 localhost (::1), convert sang IPv4
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }
    // Nếu vẫn là IPv6, lấy IP đầu tiên từ x-forwarded-for hoặc dùng fallback
    if (clientIp.includes(':')) {
      clientIp = '127.0.0.1';
    }

    const paymentParams = {
      vnp_Amount: amountNum, // Không nhân 100 - Library tự động xử lý
      vnp_IpAddr: clientIp,
      vnp_TxnRef: String(orderId),
      vnp_OrderInfo: removeVietnameseDiacritics(
        orderInfo || `Thanh toan don hang #${orderId}`
      ),
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5173/api/payments/vnpay/return',
      vnp_Locale: locale === 'en' ? VnpLocale.EN : VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
    };

    console.log('📋 Thông tin thanh toán:', paymentParams);

    const vnpayResponse = vnpay.buildPaymentUrl(paymentParams);

    console.log('✅ Tạo URL thanh toán thành công');
    console.log('🔗 URL:', vnpayResponse.substring(0, 100) + '...');
    
    return {
      success: true,
      paymentUrl: vnpayResponse,
      orderId: String(orderId),
      amount: amountNum,
      createDate: paymentParams.vnp_CreateDate
    };
  } catch (error) {
    console.error('❌ LỖI TẠO LIÊN KẾT THANH TOÁN:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
};

module.exports = { createQRUrl } ;


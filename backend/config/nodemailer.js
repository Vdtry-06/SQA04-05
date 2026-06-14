const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 30 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send reset email');
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};

async function sendOrderConfirmationEmail(email, orderData) {
  const { order_number, id, total_price, items, shipping_address, payment_method, created_at, status } = orderData;
  
  console.log('📧 Email order data:', { order_number, items, itemsCount: items?.length });
  
  const itemsHtml = (items && items.length > 0) ? items.map(item => {
    const imageUrl = item.product_avatar ? 
      (item.product_avatar.startsWith('http') ? item.product_avatar : `http://localhost:5000${item.product_avatar}`) : 
      'http://localhost:5000/images/placeholder.jpg';
    
    return `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">
        <div style="display: flex; gap: 10px;">
          <img src="${imageUrl}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; flex-shrink: 0;">
          <div>
            <strong>${item.product_name || 'N/A'}</strong><br>
            <small style="color: #666;">${item.variant_name || ''} ${item.unit || ''}</small>
          </div>
        </div>
      </td>
      <td style="padding: 12px; text-align: center;">${item.quantity || 0}</td>
      <td style="padding: 12px; text-align: right;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price || 0)}</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal || 0)}</td>
    </tr>
    `;
  }).join('') : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #999;">Không có sản phẩm</td></tr>';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Xác nhận đơn hàng #${order_number} - Bep sach viet`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #16a34a; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Bep sach viet</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Xác nhận đơn hàng</p>
        </div>

        <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #e0e0e0;">
          <h2 style="color: #16a34a; margin-top: 0;">Cảm ơn bạn đã đặt hàng!</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Mã đơn hàng:</strong> #${order_number}</p>
            <p style="margin: 0 0 10px 0;"><strong>Ngày đặt:</strong> ${new Date(created_at).toLocaleString('vi-VN')}</p>
            <p style="margin: 0 0 10px 0;"><strong>Trạng thái:</strong> 
              <span style="background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 3px;">${
                status === 'pending' ? 'Chờ xác nhận' :
                status === 'confirmed' ? 'Đã xác nhận' :
                status === 'shipping' ? 'Đang giao' :
                status === 'delivered' ? 'Đã giao' :
                status === 'canceled' ? 'Đã hủy' : status
              }</span>
            </p>
            <p style="margin: 0;"><strong>Phương thức thanh toán:</strong> ${payment_method === 'vnpay' ? 'VNPay' : 'Thanh toán khi nhận hàng (COD)'}</p>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Chi tiết sản phẩm</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #16a34a;">
                  <th style="padding: 12px; text-align: left; min-width: 250px;">Sản phẩm</th>
                  <th style="padding: 12px; text-align: center; width: 80px;">Số lượng</th>
                  <th style="padding: 12px; text-align: right; width: 120px;">Đơn giá</th>
                  <th style="padding: 12px; text-align: right; width: 120px;">Tổng</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Địa chỉ giao hàng</h3>
            <p style="margin: 0; line-height: 1.6;">${shipping_address}</p>
          </div>

          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Tạm tính:</span>
              <span>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total_price)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Phí vận chuyển:</span>
              <span>30.000 ₫</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Thuế (10%):</span>
              <span>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total_price/10)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #ddd; padding-top: 10px;">
              <span>Tổng cộng:</span>
              <span>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total_price+30000+total_price/10)}</span>
            </div>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; margin: 15px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>Thông báo quan trọng:</strong><br>
              Đơn hàng của bạn đang được xử lý. Bạn sẽ nhận được thông báo cập nhật vận chuyển trong vòng 24 giờ.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ chúng tôi:</p>
            <p style="margin: 5px 0;">Email: knight2trung@gmail.com | Hotline: 1900-1234</p>
            <p style="margin: 5px 0; color: #999;">© 2025 Bep sach viet. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    // Không throw error, chỉ log vì không muốn ảnh hưởng flow đặt hàng
    return { success: false, error: error.message };
  }
}

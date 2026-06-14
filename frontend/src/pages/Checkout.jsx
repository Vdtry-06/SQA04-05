import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, getUserId } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    paymentMethod: 'COD',
    note: '',
    createAccount: false,
  });

  // Kiểm tra đăng nhập khi vào trang
  useEffect(() => {
    if (!isAuthenticated()) {
      alert('Vui lòng đăng nhập để thanh toán');
      navigate('/auth/login');
      return;
    }
    fetchCheckoutInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCheckoutInfo = async () => {
    try {
      setLoading(true);
      
      const userId = getUserId();
      if (!userId) {
        navigate('/auth/login');
        return;
      }

      // First get cart
      const cartResponse = await fetch(`http://localhost:5000/api/cart/viewCart/${userId}`);
      if (!cartResponse.ok) {
        throw new Error('Không thể tải giỏ hàng');
      }
      const cartData = await cartResponse.json();
      
      if (!cartData.success || !cartData.data || cartData.data.items.length === 0) {
        alert('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
        navigate('/cart');
        return;
      }

      const currentCartId = cartData.data.cart_id;
      setCartId(currentCartId);

      // Then get checkout info
      const checkoutResponse = await fetch(`http://localhost:5000/api/orders/checkout/${currentCartId}`);
      if (!checkoutResponse.ok) {
        throw new Error('Không thể tải thông tin thanh toán');
      }
      const checkoutInfo = await checkoutResponse.json();
      
      if (checkoutInfo.success) {
        setCheckoutData(checkoutInfo.data);
      } else {
        throw new Error(checkoutInfo.message || 'Không thể tải thông tin thanh toán');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching checkout info:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.address || 
        !formData.city || !formData.phone || !formData.email) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Email không hợp lệ');
      return;
    }

    // Validate phone (Vietnam phone number)
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      alert('Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)');
      return;
    }

    if (!cartId) {
      alert('Không tìm thấy giỏ hàng');
      return;
    }

    try {
      setSubmitting(true);

      const userId = getUserId();
      const shippingAddress = `${formData.address}, ${formData.city}`;
      
      // Nếu thanh toán VNPay, gọi endpoint verify-and-create-order
      if (formData.paymentMethod === 'VNPAY') {
        const paymentResponse = await fetch('http://localhost:5000/api/payments/verify-and-create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            cartId: cartId,
            shippingAddress: shippingAddress,
            note: formData.note,
            amount: checkoutData.total_price,
          }),
        });

        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentResult.message || 'Không thể tạo liên kết thanh toán');
        }

        if (paymentResult.success && paymentResult.data.paymentUrl) {
          // Xóa giỏ hàng trong context
          clearCart();
          // Redirect đến trang thanh toán VNPay
          window.location.href = paymentResult.data.paymentUrl;
        } else {
          throw new Error('Không thể tạo liên kết thanh toán');
        }
      } else {
        // Thanh toán COD - tạo đơn hàng trực tiếp
        const response = await fetch('http://localhost:5000/api/orders/createOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            cartId: cartId,
            shippingAddress: shippingAddress,
            paymentMethod: formData.paymentMethod,
            note: formData.note,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Không thể tạo đơn hàng');
        }

        if (result.success) {
          const orderId = result.data.order_id;
          const orderNumber = result.data.order_number;
          const amount = result.data.total_price;
          // Xóa giỏ hàng trong context
          clearCart();
          // Chuyển đến trang kết quả thanh toán
          navigate(`/payment/result?success=true&orderId=${orderId}&orderNumber=${orderNumber}&amount=${amount}&paymentMethod=COD`);
        } else {
          throw new Error(result.message || 'Không thể tạo đơn hàng');
        }
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Không thể đặt hàng: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error || !checkoutData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Không thể tải thông tin thanh toán'}
        </div>
        <button
          onClick={() => navigate('/cart')}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Quay lại giỏ hàng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600">
          <span 
            onClick={() => navigate('/')}
            className="text-green-700 font-semibold cursor-pointer hover:underline"
          >
            TRANG CHỦ
          </span>
          <span className="mx-2">/</span>
          <span 
            onClick={() => navigate('/cart')}
            className="text-green-700 font-semibold cursor-pointer hover:underline"
          >
            GIỎ HÀNG
          </span>
          <span className="mx-2">/</span>
          <span className="text-green-700 font-semibold">THANH TOÁN</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Billing Details */}
            <div className="col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-green-600" />
                  THÔNG TIN THANH TOÁN
                </h2>

                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Họ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Địa chỉ"
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                      required
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tỉnh / Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Địa chỉ email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Create Account Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="createAccount"
                      id="createAccount"
                      checked={formData.createAccount}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <label htmlFor="createAccount" className="text-sm text-gray-700">
                      Tạo tài khoản mới?
                    </label>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    THÔNG TIN BỔ SUNG
                  </h3>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú đơn hàng (tùy chọn)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b-4 border-green-600">
                  ĐỚN HÀNG CỦA BẠN
                </h2>

                {/* Products */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between font-semibold text-gray-700 pb-2 border-b">
                    <span>SẢN PHẨM</span>
                    <span>TẠM TÍNH</span>
                  </div>

                  {checkoutData.items.map((item) => (
                    <div key={item.cart_item_id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {((item.price_sale || item.price || 0) * item.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex items-center justify-between text-gray-700">
                    <span>Tạm tính</span>
                    <span className="font-semibold">
                      {checkoutData.subtotal.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-700">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold">
                      {checkoutData.shipping_fee.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  {checkoutData.tax && checkoutData.tax > 0 && (
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Thuế (VAT 10%)</span>
                      <span className="font-semibold">
                        {checkoutData.tax.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between text-xl font-bold text-gray-800 my-4">
                  <span>Tổng cộng</span>
                  <span className="text-green-600">
                    {checkoutData.total_price.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* Payment Method */}
                <div className="mb-6 pt-4 border-t">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Phương thức thanh toán
                  </h3>
                  
                  {/* COD */}
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Trả tiền mặt khi nhận hàng</span>
                    </label>
                    {formData.paymentMethod === 'COD' && (
                      <p className="text-xs text-gray-500 mt-2 ml-6">
                        Trả tiền mặt khi giao hàng
                      </p>
                    )}
                  </div>

                  {/* VNPay */}
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="VNPAY"
                        checked={formData.paymentMethod === 'VNPAY'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Thanh toán VNPay (QR Code)</span>
                    </label>
                    {formData.paymentMethod === 'VNPAY' && (
                      <p className="text-xs text-gray-500 mt-2 ml-6">
                        Quét mã QR để thanh toán qua VNPay. Hỗ trợ tất cả ngân hàng và ví điện tử.
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  Thông tin cá nhân của bạn sẽ được sử dụng để xử lý đơn hàng, tăng trải nghiệm sử dụng website, và cho các mục đích cụ thể khác đã được mô tả trong chính sách riêng tư.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
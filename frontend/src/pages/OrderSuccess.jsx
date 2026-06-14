import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, MapPin, CreditCard, Phone, Mail } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useCart();

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/orderDetail/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrderDetails(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
    // Làm mới giỏ hàng để cập nhật số đếm
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận.
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
            </div>
          ) : orderDetails ? (
            <>
              {/* Order Number */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Mã đơn hàng</p>
                    <p className="text-2xl font-bold text-green-600">#{orderDetails.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {orderDetails.total_price.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Thông tin giao hàng
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-800">{orderDetails.customer_name}</p>
                    <p>{orderDetails.shipping_address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="w-4 h-4" />
                      <span>{orderDetails.customer_phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{orderDetails.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Phương thức thanh toán
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">
                      {orderDetails.payment_method === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : orderDetails.payment_method}
                    </p>
                    <p className="mt-2">
                      Trạng thái: 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        orderDetails.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {orderDetails.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Sản phẩm đã đặt
                </h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded">
                      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {item.product_avatar ? (
                          <img 
                            src={item.product_avatar} 
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-600">{item.variant_name} - {item.unit}</p>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          {item.subtotal.toLocaleString('vi-VN')} ₫
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.price.toLocaleString('vi-VN')} ₫/sp
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              {orderDetails.note && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-semibold text-gray-800 mb-1">Ghi chú:</p>
                  <p className="text-sm text-gray-600">{orderDetails.note}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Không tìm thấy thông tin đơn hàng</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Bước tiếp theo</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Chúng tôi sẽ xác nhận đơn hàng qua email/số điện thoại trong vòng 24h</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Đơn hàng sẽ được đóng gói và vận chuyển trong 2-3 ngày làm việc</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Bạn có thể theo dõi tình trạng đơn hàng qua email hoặc liên hệ hotline hỗ trợ</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Tiếp tục mua sắm
          </button>
          {orderId && (
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="px-8 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              Xem đơn hàng
            </button>
          )}
        </div>

        {/* Contact Info */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Cần hỗ trợ? Liên hệ hotline: <a href="tel:1900xxxx" className="text-green-600 font-semibold">1900 xxxx</a></p>
          <p>hoặc email: <a href="mailto:support@example.com" className="text-green-600 font-semibold">support@example.com</a></p>
        </div>
      </div>
    </div>
  );
}

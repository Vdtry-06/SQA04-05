import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, ArrowLeft, MapPin, CreditCard, FileText, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function OrderDetail() {
  const { orderId } = useParams();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId || !token) return;

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/orders/orderDetail/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Không thể tải thông tin đơn hàng');
        }
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError('Có lỗi xảy ra khi tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, token]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      canceled: 'Đã hủy'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      shipping: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
      canceled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      setIsCanceling(true);
      const response = await fetch(`http://localhost:5000/api/orders/cancelOrder/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Đơn hàng đã được hủy thành công');
        setShowCancelModal(false);
        setCancelReason('');
        // Reload order detail
        const detailResponse = await fetch(`http://localhost:5000/api/orders/orderDetail/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const detailData = await detailResponse.json();
        if (detailResponse.ok && detailData.success) {
          setOrder(detailData.data);
        }
      } else {
        alert(data.message || 'Không thể hủy đơn hàng');
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      alert('Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy đơn hàng'}</p>
          <button
            onClick={() => navigate('/account/orders')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/account/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại danh sách đơn hàng
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Chi tiết đơn hàng #{order.order_number || order.id}
          </h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Trạng thái đơn hàng */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-4 py-2 rounded-full text-base font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {getStatusText(order.status)}
              </span>
              <span className={`px-4 py-2 rounded-full text-base font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-600">Ngày đặt: </span>
                <span className="font-medium">{formatDateTime(order.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-600">Cập nhật: </span>
                <span className="font-medium">{formatDateTime(order.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin khách hàng
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Họ tên:</span> <span className="font-medium">{order.customer_name}</span></p>
              <p><span className="text-gray-600">Email:</span> <span className="font-medium">{order.customer_email}</span></p>
              <p><span className="text-gray-600">Số điện thoại:</span> <span className="font-medium">{order.customer_phone || 'Chưa cập nhật'}</span></p>
            </div>
          </div>

          {/* Địa chỉ giao hàng */}
          {order.shipping_address && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Địa chỉ giao hàng
              </h3>
              <p className="text-sm">{order.shipping_address}</p>
            </div>
          )}

          {/* Phương thức thanh toán */}
          {order.payment_method && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Phương thức thanh toán
              </h3>
              <p className="text-sm">{order.payment_method}</p>
            </div>
          )}

          {/* Ghi chú */}
          {order.note && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Ghi chú
              </h3>
              <p className="text-sm">{order.note}</p>
            </div>
          )}

          {/* Danh sách sản phẩm */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Sản phẩm ({order.order_items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 py-3 border-b last:border-b-0">
                    <img
                      src={item.product_avatar || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.variant_name} - {item.unit}
                      </p>
                      <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-600">{formatPrice(item.price)}/sp</p>
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => navigate(`/product/${item.product_id}?tab=reviews`)}
                          className="text-xs text-green-600 hover:underline mt-1"
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Không có sản phẩm nào trong đơn hàng</p>
              )}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">Tổng cộng</span>
              <span className="text-2xl font-bold text-green-600">{formatPrice(order.total_price)}</span>
            </div>
          </div>

          {/* Nút hủy đơn hàng */}
          {order.status === 'pending' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hủy đơn hàng</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy đơn hàng:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows="4"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCanceling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

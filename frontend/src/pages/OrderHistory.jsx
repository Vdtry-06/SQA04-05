import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, ArrowLeft, X, MapPin, CreditCard, FileText, User, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderHistory() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [orderReviewStatus, setOrderReviewStatus] = useState(null);



  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy lịch sử đơn hàng
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id || !token) return;

      try {
        setOrdersLoading(true);
        // Lấy tất cả đơn hàng KHÔNG lọc để tính số thứ tự đúng
        const allResponse = await fetch(`http://localhost:5000/api/orders/myOrders/${user.id}?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const allData = await allResponse.json();

        if (allResponse.ok && allData.success) {
          const allOrdersList = allData.data || [];
          setAllOrders(allOrdersList);
          
          // Lọc theo status nếu không phải 'all'
          if (selectedStatus !== 'all') {
            const filteredOrders = allOrdersList.filter(order => order.status === selectedStatus);
            setOrders(filteredOrders);
          } else {
            setOrders(allOrdersList);
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id, token, selectedStatus]);

  // Fetch per-order review status (window + per-item reviewed)
  async function fetchOrderReviewStatus(orderId) {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/order/${orderId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return setOrderReviewStatus(null);
      const data = await res.json();
      setOrderReviewStatus(data?.data || null);
    } catch (e) {
      console.error('Error fetching order review status', e);
      setOrderReviewStatus(null);
    }
  }


  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // Review modal helpers
  const openReviewModal = (item) => {
    setReviewingItem(item);
    setReviewRating(0);


    setReviewComment('');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewingItem(null);
    setReviewRating(0);
    setReviewComment('');
  };



  const handleSubmitReview = async () => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      alert('Vui lòng chọn số sao (1-5).');
      return;
    }



    try {
      setReviewSubmitting(true);
      const res = await fetch('http://localhost:5000/api/reviews/fromOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrder?.id,
          variantId: reviewingItem.variant_id,
          rating: reviewRating,
          comment: reviewComment?.trim() || ''
        })
      });
      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text };
      }
      if (res.ok) {
        alert('Gửi đánh giá thành công!');
        closeReviewModal();
        if (selectedOrder?.id) {
          fetchOrderReviewStatus(selectedOrder.id);
        }
      } else {
        const msg = data?.message || `Gửi đánh giá thất bại (mã ${res.status}).`;
        alert(msg);
      }
    } catch (e) {
      console.error('Submit review error', e);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setReviewSubmitting(false);
    }
  };

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
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      shipping: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      canceled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Package className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại trang cá nhân
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Lịch sử đơn hàng
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ xác nhận
            </button>
            <button
              onClick={() => setSelectedStatus('confirmed')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'confirmed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã xác nhận
            </button>
            <button
              onClick={() => setSelectedStatus('shipping')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'shipping'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang giao
            </button>
            <button
              onClick={() => setSelectedStatus('delivered')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã giao
            </button>
            <button
              onClick={() => setSelectedStatus('canceled')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedStatus === 'canceled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã hủy
            </button>
          </div>

          {/* Orders list */}
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Chưa có đơn hàng nào</p>
              <button
                onClick={() => navigate('/home')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">Đơn hàng #{order.order_number || order.id}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>{order.total_items} sản phẩm</p>
                      <p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="text-lg font-bold text-green-600">{formatPrice(order.total_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popup đánh giá sản phẩm */}
        {showReviewModal && reviewingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="text-lg font-semibold">Đánh giá sản phẩm</h3>
                <button onClick={closeReviewModal} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Thông tin sản phẩm */}
                <div className="flex items-center gap-3">
                  <img
                    src={reviewingItem.product_avatar || '/placeholder.png'}
                    alt={reviewingItem.product_name}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />
                  <div>
                    <p className="font-medium">{reviewingItem.product_name}</p>
                    <p className="text-sm text-gray-600">{reviewingItem.variant_name} • {reviewingItem.unit}</p>
                  </div>
                </div>

                {/* Chọn số sao */}
                <div>
                  <p className="text-sm text-gray-700 mb-2">Đánh giá của bạn</p>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        className="p-1"
                        aria-label={`Chọn ${n} sao`}
                      >
                        <Star
                          className={`w-7 h-7 ${reviewRating >= n ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill={reviewRating >= n ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nhập bình luận */}
                <div>
                  <p className="text-sm text-gray-700 mb-2">Bình luận (không bắt buộc)</p>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t flex items-center justify-end gap-3 bg-gray-50 rounded-b-xl">
                <button onClick={closeReviewModal} className="px-4 py-2 rounded-lg border hover:bg-gray-100">Hủy</button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewRating < 1}
                  className={`px-5 py-2 rounded-lg text-white font-semibold shadow ${reviewSubmitting || reviewRating < 1 ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

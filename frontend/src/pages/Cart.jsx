import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { getUserId, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart data
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
      return;
    }
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      console.log('👤 Fetching cart for userId:', userId);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`http://localhost:5000/api/cart/viewCart/${userId}`);
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cart');
      }
      
      if (data.success) {
        // Xử lý trường hợp cart null hoặc chưa có items
        if (data.data && data.data.items) {
          setCartItems(data.data.items);
        } else {
          setCartItems([]);
        }
        // Cập nhật cart count trong context
        refreshCart();
      } else {
        throw new Error(data.message || 'Failed to fetch cart');
      }
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching cart:', err);
      setError(err.message);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      const response = await fetch(`http://localhost:5000/api/cart/updateItem/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // Refresh cart
      await fetchCart();
      refreshCart(); // Update cart count in header
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Không thể cập nhật số lượng');
    }
  };

  // Remove item
  const removeItem = async (cartItemId) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/cart/removeItem/${cartItemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Refresh cart
      await fetchCart();
      refreshCart(); // Update cart count in header
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Không thể xóa sản phẩm');
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.price || item.product_price || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 0 ? 30000 : 0; // Phí ship cố định
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600">
          <span 
            onClick={() => navigate('/homePage')}
            className="text-green-700 font-semibold cursor-pointer hover:underline"
          >
            TRANG CHỦ
          </span>
          <span className="mx-2">/</span>
          <span className="text-green-700 font-semibold">GIỎ HÀNG</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-green-600" />
          Giỏ Hàng Của Bạn
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="w-24 h-24 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
            <button
              onClick={() => navigate('/product')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 text-white px-6 py-4 grid grid-cols-12 gap-4 font-semibold">
                  <div className="col-span-5">SẢN PHẨM</div>
                  <div className="col-span-2 text-center">GIÁ</div>
                  <div className="col-span-3 text-center">SỐ LƯỢNG</div>
                  <div className="col-span-2 text-right">TẠM TÍNH</div>
                </div>

                {/* Items */}
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                      {/* Product Info */}
                      <div className="col-span-5 flex items-center gap-4">
                        <button
                          onClick={() => removeItem(item.cart_item_id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product_avatar ? (
                            <img 
                              src={item.product_avatar} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" font-size="40" text-anchor="middle" dominant-baseline="middle"%3E📦%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-100">
                              📦
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 line-clamp-2">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.variant_name}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2 text-center">
                        <span className="text-green-600 font-semibold">
                          {(item.price || item.product_price || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          className="w-16 text-center border border-gray-300 rounded py-1 font-semibold"
                        />
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="col-span-2 text-right">
                        <span className="text-lg font-bold text-gray-800">
                          {((item.price || item.product_price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/product')}
                  className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
                >
                  ← TIẾP TỤC XEM SẢN PHẨM
                </button>
                <button
                  onClick={fetchCart}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  CẬP NHẬT GIỎ HÀNG
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b-4 border-orange-500">
                  CỘNG GIỎ HÀNG
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-gray-700">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-lg">
                      {subtotal.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-700 pb-4 border-b">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold text-lg">
                      {shipping.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-800 text-xl font-bold">
                    <span>Tổng</span>
                    <span className="text-green-600">
                      {total.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition mb-3"
                >
                  TIẾN HÀNH THANH TOÁN
                </button>

                <div className="bg-gray-50 rounded p-3 text-sm text-gray-600">
                  <p className="mb-2">📌 <strong>Phiếu ưu đãi</strong></p>
                  <input
                    type="text"
                    placeholder="Mã ưu đãi"
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                  />
                  <button className="w-full bg-gray-200 text-gray-700 py-2 rounded font-semibold hover:bg-gray-300 transition">
                    Áp dụng
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>Trả tiền mỗi khi nhận hàng</p>
                  <p className="mt-1">Trả tiền mỗi khi giao hàng chi tiết hơn</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
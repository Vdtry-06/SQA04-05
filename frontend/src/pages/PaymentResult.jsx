import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Package, CreditCard, Calendar } from 'lucide-react';

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const amount = searchParams.get('amount');
  const transactionNo = searchParams.get('transactionNo');
  const paymentMethod = searchParams.get('paymentMethod') || 'VNPAY';
  const message = searchParams.get('message') || (success ? 'Thanh toán thành công' : 'Thanh toán thất bại');

  // Xử lý cập nhật payment status khi thanh toán thành công (chỉ cho VNPay)
  useEffect(() => {
    if (success && orderId && paymentMethod === 'VNPAY') {
      const updatePaymentStatus = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/payments/update-payment-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              paymentStatus: 'paid',
              transactionNo: transactionNo || '',
            }),
          });

          const result = await response.json();
          console.log('Payment status update result:', result);
          
          if (!result.success) {
            console.error('Failed to update payment status:', result.message);
          }
        } catch (error) {
          console.error('Error updating payment status:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      updatePaymentStatus();
    } else {
      setIsProcessing(false);
    }
  }, [success, orderId, transactionNo, paymentMethod]);



  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Đang xử lý...
          </h1>
          <p className="text-center text-gray-600">Vui lòng chờ, hệ thống đang xác nhận thanh toán của bạn</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {paymentMethod === 'COD' ? 'Đặt hàng thành công!' : 'Thanh toán thành công!'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {paymentMethod === 'COD' 
              ? 'Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ liên hệ với bạn sớm để xác nhận.' 
              : message}
          </p>

          {/* Order Details */}
          <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg">
            {orderId && (
              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Mã đơn hàng</p>
                  <p className="font-semibold text-gray-800">
                    {orderNumber ? `#${orderNumber}` : `#${orderId}`}
                  </p>
                </div>
              </div>
            )}

            {amount && (
              <div className="flex items-start space-x-3">
                <CreditCard className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">
                    {paymentMethod === 'COD' ? 'Tổng tiền hàng' : 'Số tiền thanh toán'}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {(Number(amount)).toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            )}

            {transactionNo && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Mã giao dịch</p>
                  <p className="font-semibold text-gray-800">{transactionNo}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/account/orders')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Xem đơn hàng của tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed Payment
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-center text-gray-600 mb-6">{message}</p>

        {/* Order Details */}
        {orderId && (
          <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Mã đơn hàng</p>
                <p className="font-semibold text-gray-800">
                  {orderNumber ? `#${orderNumber}` : `#${orderId}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 text-center">
          <button
            onClick={async () => {
              try {
                // Lấy userId từ user object trong localStorage
                const userData = localStorage.getItem('user');
                const userId = userData ? JSON.parse(userData).id : null;
                
                if (!userId) {
                  alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                  return;
                }

                if (!orderId) {
                  alert('Không tìm thấy đơn hàng. Vui lòng thử lại.');
                  return;
                }

                // Khôi phục giỏ hàng từ đơn hàng chưa thanh toán
                const response = await fetch('http://localhost:5000/api/cart/restore-from-order', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: userId,
                    orderId: orderId
                  }),
                });

                const result = await response.json();
                if (!result.success) {
                  alert('Lỗi: ' + (result.message || 'Không thể khôi phục giỏ hàng'));
                  console.error('Failed to restore cart:', result.message);
                  return;
                }

                navigate('/checkout');
              } catch (error) {
                console.error('Error restoring cart:', error);
                alert('Lỗi: ' + error.message);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Thử lại thanh toán
          </button>
          <button
            onClick={() => navigate('/account/orders')}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Xem đơn hàng của tôi
          </button>
        </div>
      </div>
    </div>
  );
}

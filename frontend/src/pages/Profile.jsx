import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Calendar, Edit2, Save, X, Lock, Key, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // State cho đổi mật khẩu
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // State cho thống kê đơn hàng
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    shipping: 0,
    delivered: 0
  });

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin user từ API
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id || !token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setUserInfo(data.data);
          setFormData({
            name: data.data.name || '',
            email: data.data.email || '',
            phone: data.data.phone || ''
          });
        } else {
          setError(data.message || 'Không thể tải thông tin người dùng');
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('Có lỗi xảy ra khi tải thông tin');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user?.id, token]);

  // Lấy thống kê đơn hàng
  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!user?.id || !token) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/orders/myOrders/${user.id}?page=1&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          const allOrders = data.data || [];
          
          // Tính toán thống kê
          const stats = {
            total: allOrders.length,
            pending: allOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
            shipping: allOrders.filter(o => o.status === 'shipping').length,
            delivered: allOrders.filter(o => o.status === 'delivered').length
          };
          setOrderStats(stats);
        }
      } catch (err) {
        console.error('Error fetching order stats:', err);
      }
    };

    fetchOrderStats();
  }, [user?.id, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form về dữ liệu gốc
    if (userInfo) {
      setFormData({
        name: userInfo.name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserInfo(data.data);
        setIsEditing(false);
        alert('Cập nhật thông tin thành công!');
      } else {
        alert(data.message || 'Không thể cập nhật thông tin');
      }
    } catch (err) {
      console.error('Error updating user info:', err);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordSuccess('Đổi mật khẩu thành công!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Không thể đổi mật khẩu');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl font-bold">
                {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userInfo?.name || 'Người dùng'}</h1>
                <p className="text-gray-600">Khách hàng</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông tin cá nhân</h2>
          
          <div className="space-y-6">
            {/* Họ tên */}
            <div className="flex items-start gap-4">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Họ và tên</label>
                {!isEditing ? (
                  <p className="text-gray-800 text-lg">{userInfo?.name || 'Chưa cập nhật'}</p>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                {!isEditing ? (
                  <p className="text-gray-800 text-lg">{userInfo?.email || 'Chưa cập nhật'}</p>
                ) : (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled
                  />
                )}
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                {!isEditing ? (
                  <p className="text-gray-800 text-lg">{userInfo?.phone || 'Chưa cập nhật'}</p>
                ) : (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Ngày tạo tài khoản */}
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo tài khoản</label>
                <p className="text-gray-800 text-lg">{formatDate(userInfo?.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phần đổi mật khẩu */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Bảo mật
            </h2>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Key className="w-4 h-4" />
                Đổi mật khẩu
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Save className="w-4 h-4" />
                  Lưu mật khẩu mới
                </button>
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            </form>
          )}

          {!isChangingPassword && (
            <div className="text-gray-600">
              <p className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Mật khẩu: ••••••••
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Nhấn nút "Đổi mật khẩu" để thay đổi mật khẩu của bạn
              </p>
            </div>
          )}
        </div>

        {/* Thống kê */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/account/orders')}
          >
            <p className="text-gray-600 mb-2">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-green-600">{orderStats.total}</p>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/account/orders')}
          >
            <p className="text-gray-600 mb-2">Đơn đang giao</p>
            <p className="text-3xl font-bold text-blue-600">{orderStats.shipping}</p>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-6 text-center cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/account/orders')}
          >
            <p className="text-gray-600 mb-2">Đơn hoàn thành</p>
            <p className="text-3xl font-bold text-gray-600">{orderStats.delivered}</p>
          </div>
        </div>

        {/* Nút xem lịch sử đơn hàng */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Đơn hàng của tôi</h3>
                <p className="text-sm text-gray-600">Xem lịch sử và theo dõi đơn hàng</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/account/orders')}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Xem tất cả
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

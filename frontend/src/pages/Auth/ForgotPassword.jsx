import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Kiểm tra email của bạn</h2>
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến <span className="font-medium">{email}</span>
            </p>
            <Link 
              to="/auth/login" 
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ← Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-green-700">Quên Mật Khẩu</h1>
          <p className="text-sm text-gray-600 mt-2">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
          </p>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/auth/login" className="text-green-700 font-medium hover:text-green-800">
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

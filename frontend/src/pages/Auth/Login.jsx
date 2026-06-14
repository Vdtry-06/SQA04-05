import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        const role = result.user.role;
        
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-green-700">Chào mừng trở lại</h1>
          <p className="text-sm text-gray-600">Đăng nhập vào tài khoản của bạn</p>
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Mật Khẩu</label>
              <Link to="/auth/forgot-password" className="text-sm text-green-700 hover:text-green-800">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Bạn chưa có tài khoản? </span>
          <Link to="/auth/register" className="text-green-700 font-medium">Đăng ký</Link>
        </div>
      </div>
    </div>
  );
}
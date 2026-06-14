import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra token khi app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const body = await res.json();
      
      if (!res.ok) {
        throw new Error(body.message || 'Login failed');
      }

      const receivedToken = body.token;
      if (!receivedToken) {
        throw new Error('No token received');
      }

      // Lưu token
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);

      // Gọi /me để lấy thông tin user
      const meRes = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${receivedToken}` }
      });
      
      const meBody = await meRes.json();
      
      if (meRes.ok && meBody.success) {
        const userData = {
          id: meBody.data.id,
          email: meBody.data.email,
          name: meBody.data.name,
          role: meBody.data.role || 'customer'
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const getUserId = () => {
    return user?.id || null;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    getUserId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

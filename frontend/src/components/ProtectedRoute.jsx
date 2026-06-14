import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải...</div>;
  }

  // Kiểm tra user có role admin không
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

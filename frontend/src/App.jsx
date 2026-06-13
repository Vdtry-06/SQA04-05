import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AdminRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Admin/Dashboard';
import Products from './pages/Admin/Products';
import Orders from './pages/Admin/Orders';
import Users from './pages/Admin/Users';
import AdminBlogs from './pages/Admin/Blogs';
import AdminReports from './pages/Admin/Reports';
import AdminContact from './pages/Admin/Contact';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Home from './pages/Home';
import Layout from "./components/Layout";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import OrderSuccess from "./pages/OrderSuccess";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import Distributor from "./pages/Distributor";
import Contact from "./pages/Contact";
import PaymentResult from "./pages/PaymentResult";

export default function App() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Auto redirect admin to dashboard khi page load
  useEffect(() => {
    if (!loading && user && (user.role === 'admin' || user.role === 'staff')) {
      const currentPath = window.location.pathname;
      // Chỉ redirect nếu đang ở / hay /home
      if (currentPath === '/' || currentPath === '/home') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* Auth Routes - Without Layout */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      
      {/* Payment Routes - Without Layout */}
      <Route path="/payment/success" element={<PaymentResult />} />
      <Route path="/payment/failed" element={<PaymentResult />} />
      <Route path="/payment/result" element={<PaymentResult />} />
      
      {/* Main Routes - With Layout */}
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/product/:productId" element={<ProductDetail />} />
        <Route path="/account" element={<Profile />} />
        <Route path="/account/orders" element={<OrderHistory />} />
        <Route path="/orders/:orderId" element={<OrderDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/distributor" element={<Distributor />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><Products /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><Orders /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/admin/blogs" element={<AdminRoute><AdminBlogs /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      <Route path="/admin/contact" element={<AdminRoute><AdminContact /></AdminRoute>} />
      
      {/* 404 Page */}
      <Route path="*" element={<div style={{ padding: 24 }}>Page not found</div>} />
    </Routes>
  );
}


import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate(); // <-- dùng để chuyển trang sau khi logout

  useEffect(() => {
    const saved = localStorage.getItem('admin.sidebar.collapsed') === '1';
    setCollapsed(saved);
    const root = document.querySelector('.admin-root');
    if (root) root.classList.toggle('sidebar-collapsed', saved);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin.sidebar.collapsed', next ? '1' : '0');
    const root = document.querySelector('.admin-root');
    if (root) root.classList.toggle('sidebar-collapsed', next);
  }

  // Hàm logout: xóa token/user khỏi localStorage và chuyển về trang login
  function handleLogout() {
    // optional: confirm trước khi logout
    if (!window.confirm('Bạn có chắc muốn đăng xuất không?')) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Nếu có storage khác liên quan đến admin, xóa luôn (ví dụ admin.*)
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('admin.')) localStorage.removeItem(k);
    });

    // Chuyển về trang login của app
    navigate('/auth/login');
  }

  return (
    <aside className="admin-sidebar" aria-hidden={collapsed}>
      <div>
        <div className="brand-wrap">
          <div className="brand-logo" aria-hidden>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="6" fill="#fff" />
              <path d="M7 13c1.5-4 6-6 8-6" stroke="#2f9e44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 21c0-5 4-9 9-9" stroke="#145214" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">Cửa hàng thực phẩm</div>
            <div className="brand-sub">Trang quản lý</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 13h8V3H3v10zM13 21h8V11h-8v10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Trang chủ</span>
          </NavLink>

          <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73L13 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 22l9-4.27A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Quản lý sản phẩm</span>
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7h18M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Quản lý đơn hàng</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Quản lý người dùng</span>
          </NavLink>

          <NavLink to="/admin/blogs" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 8h8M8 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Quản lý bài viết</span>
          </NavLink>

          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 11h2v6H7zM13 7h2v10h-2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Thống kê doanh thu</span>
          </NavLink>

          <NavLink to="/admin/contact" className={({ isActive }) => isActive ? 'admin-link active' : 'admin-link'}>
            <span className="link-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="link-label">Liên hệ & CSKH</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <small>v1.0.0</small>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button className="sidebar-btn" title="Toggle sidebar" onClick={toggle} aria-pressed={collapsed}>
            {collapsed ? '›' : '‹'}
          </button>

          {/* Logout button placed in footer, styled like existing controls */}
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="sidebar-btn"
            style={{ marginLeft: 8 }}
          >
            {/* simple icon + label (bạn có thể thay bằng svg) */}
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
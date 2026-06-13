import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

export default function Dashboard() {
  const [counts, setCounts] = useState({ users: 0, products: 0, orders: 0 });
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [uRes, pRes, oRes] = await Promise.all([
          fetch('/api/users/getAllUsers').then(r => r.json()),
          fetch('/api/products/getAllProducts').then(r => r.json()),
          fetch('/api/orders/getAllOrder').then(r => r.json())
        ]);
        setCounts({
          users: Array.isArray(uRes.data) ? uRes.data.length : 0,
          products: Array.isArray(pRes.data) ? pRes.data.length : 0,
          orders: Array.isArray(oRes.data) ? oRes.data.length : 0
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    loadCounts();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadReports() {
      setLoadingReports(true);
      setReportsError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [pRes, bRes, sRes] = await Promise.all([
          fetch('/api/reports/top-products?limit=3', { headers }).then(r => r.json()),
          fetch('/api/reports/top-buyers?limit=5', { headers }).then(r => r.json()),
          fetch('/api/reports/revenue-summary', { headers }).then(r => r.json())
        ]);
        if (!mounted) return;
        if (!pRes?.success) throw new Error(pRes?.message || 'Lỗi top-products');
        if (!bRes?.success) throw new Error(bRes?.message || 'Lỗi top-buyers');
        if (!sRes?.success) throw new Error(sRes?.message || 'Lỗi revenue-summary');

        setTopProducts(pRes.data || []);
        setTopBuyers(bRes.data || []);
        setSummary(sRes.data || {});
      } catch (err) {
        console.error('Load reports error', err);
        if (mounted) setReportsError(err.message || String(err));
      } finally {
        if (mounted) setLoadingReports(false);
      }
    }
    loadReports();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Trang chủ" />

        <section className="admin-cards">
          <div className="card">
            <div className="card-title">Tổng doanh thu</div>
            <div className="card-value" style={{ color: '#4CAF50', fontSize: '24px' }}>
              {summary ? formatCurrency(summary.total_revenue) : '0 ₫'}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Tổng đơn hàng</div>
            <div className="card-value">{summary?.total_orders || 0}</div>
          </div>
          <div className="card">
            <div className="card-title">Khách hàng</div>
            <div className="card-value">{summary?.total_customers || 0}</div>
          </div>
          <div className="card">
            <div className="card-title">Sản phẩm bán</div>
            <div className="card-value">{summary?.total_items || 0}</div>
          </div>
          <div className="card">
            <div className="card-title">Tổng người dùng</div>
            <div className="card-value">{counts.users}</div>
          </div>
          <div className="card">
            <div className="card-title">Tổng sản phẩm</div>
            <div className="card-value">{counts.products}</div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Báo cáo</h2>

          {loadingReports && <div className="mb-4 text-gray-600">Đang tải thống kê...</div>}
          {reportsError && <div className="mb-4 text-red-600">Lỗi: {reportsError}</div>}

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                Giá trị trung bình / đơn
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                {summary && summary.total_orders > 0 
                  ? formatCurrency(summary.total_revenue / summary.total_orders)
                  : '0 ₫'
                }
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                Sản phẩm / đơn
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF9800' }}>
                {summary && summary.total_orders > 0 
                  ? (summary.total_items / summary.total_orders).toFixed(2)
                  : '0'
                }
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ color: '#666', fontSize: '12px', marginBottom: '12px' }}>
                Tỷ lệ chuyển đổi
              </div>
              {counts.users > 0 ? (
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom: '8px' }}>
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="10" />
                  
                  {/* Conversion rate pie */}
                  {(() => {
                    const conversionRate = ((summary?.total_customers || 0) / counts.users) * 100;
                    const circumference = 2 * Math.PI * 50;
                    const strokeDashoffset = circumference - (conversionRate / 100) * circumference;
                    return (
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#9C27B0"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    );
                  })()}
                  
                  {/* Center text */}
                  <text 
                    x="60" 
                    y="65" 
                    textAnchor="middle" 
                    fontSize="24" 
                    fontWeight="bold" 
                    fill="#9C27B0"
                  >
                    {((summary?.total_customers || 0) / counts.users * 100).toFixed(1)}%
                  </text>
                </svg>
              ) : (
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="10" />
                  <text x="60" y="65" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#ccc">
                    0%
                  </text>
                </svg>
              )}
              <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
                {summary?.total_customers || 0} / {counts.users} khách
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white shadow rounded p-4">
              <h3 className="text-lg font-semibold mb-3">Top 3 sản phẩm theo doanh thu</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">STT</th>
                    <th className="pb-2">Sản phẩm</th>
                    <th className="pb-2">Doanh thu</th>
                    <th className="pb-2">Số bán</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 && (
                    <tr><td colSpan="4" className="py-4 text-gray-500">Không có dữ liệu</td></tr>
                  )}
                  {topProducts.map((p, idx) => (
                    <tr key={p.product_id} className="border-t">
                      <td className="py-3 w-8">{idx + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {p.avatar ? <img src={p.avatar} alt={p.product_name} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-gray-100 rounded" />}
                          <div>
                            <div className="font-medium">{p.product_name}</div>
                            <div className="text-xs text-gray-500">ID: {p.product_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{formatCurrency(p.revenue)}</td>
                      <td className="py-3">{p.total_sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white shadow rounded p-4">
              <h3 className="text-lg font-semibold mb-3">Người mua nhiều nhất</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">STT</th>
                    <th className="pb-2">Người mua</th>
                    <th className="pb-2">Số đơn</th>
                    <th className="pb-2">Tổng chi</th>
                  </tr>
                </thead>
                <tbody>
                  {topBuyers.length === 0 && (
                    <tr><td colSpan="4" className="py-4 text-gray-500">Không có dữ liệu</td></tr>
                  )}
                  {topBuyers.map((u, idx) => (
                    <tr key={u.user_id} className="border-t">
                      <td className="py-3 w-8">{idx + 1}</td>
                      <td className="py-3">
                        <div className="font-medium">{u.name || '(khách)'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="py-3">{u.orders_count}</td>
                      <td className="py-3">{formatCurrency(u.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </section>
      </main>
    </div>
  );
}
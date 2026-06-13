import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';

const AdminReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchReports = async () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng thời gian');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate
      });

      // Fetch summary
      const summaryRes = await fetch(`/api/reports/revenue-summary?${params}`);
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.data);
      }

      // Fetch monthly data
      const monthlyRes = await fetch(`/api/reports/revenue-by-month?${params}`);
      const monthlyData = await monthlyRes.json();
      if (monthlyData.success) {
        // Sort ascending: cũ nhất ở trái, mới nhất ở phải
        const sorted = (monthlyData.data || []).sort((a, b) => a.month.localeCompare(b.month));
        setMonthlyData(sorted);
      }

      // Fetch top products
      const productsRes = await fetch(`/api/reports/top-products?limit=5&${params}`);
      const productsData = await productsRes.json();
      if (productsData.success) {
        setTopProducts(productsData.data);
      }

      // Fetch top buyers
      const buyersRes = await fetch(`/api/reports/top-buyers?limit=5&${params}`);
      const buyersData = await buyersRes.json();
      if (buyersData.success) {
        setTopBuyers(buyersData.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Thống kê doanh thu" />

        {/* Date Range Filter */}
        <div style={{
          padding: '24px',
          backgroundColor: '#f5f5f5',
          marginBottom: '24px',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            alignItems: 'flex-end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="search-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <button
                onClick={fetchReports}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Đang tải...' : 'Xem báo cáo'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Tổng doanh thu
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {formatCurrency(summary.total_revenue)}
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Số đơn hàng
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {summary.total_orders}
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Số khách hàng
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                {summary.total_customers}
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '8px' }}>
                Số sản phẩm bán
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                {summary.total_items}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Monthly Revenue Chart */}
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            gridColumn: '1 / -1'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Doanh thu theo tháng</h3>
            {monthlyData.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Không có dữ liệu
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                alignItems: 'flex-end', 
                overflowX: 'auto',
                paddingBottom: '16px',
                minHeight: '250px'
              }}>
                {monthlyData.map((d) => {
                  const maxRevenue = Math.max(...monthlyData.map(item => item.revenue));
                  const height = maxRevenue ? Math.round((d.revenue / maxRevenue) * 200) : 0;
                  return (
                    <div key={d.month} style={{ 
                      textAlign: 'center', 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '80px'
                    }}>
                      <div style={{
                        backgroundColor: '#4CAF50',
                        borderRadius: '4px 4px 0 0',
                        height: `${height}px`,
                        width: '60px',
                        marginBottom: '8px',
                        position: 'relative',
                        transition: 'background-color 0.3s'
                      }} 
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
                      title={formatCurrency(d.revenue)}
                      />
                      <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                        {d.month}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        {formatCurrency(d.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tables Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Monthly Revenue */}
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Chi tiết doanh thu theo tháng</h3>
            {monthlyData.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Không có dữ liệu
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Tháng</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.month}</td>
                      <td style={{ textAlign: 'right', padding: '8px', color: '#4CAF50', fontWeight: 'bold' }}>
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Top Products */}
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Sản phẩm bán chạy</h3>
            {topProducts.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                Không có dữ liệu
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Tên sản phẩm</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>Bán</th>
                    <th style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px', fontSize: '13px' }}>
                        {item.product_name.substring(0, 20)}...
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{item.total_sold}</td>
                      <td style={{ textAlign: 'right', padding: '8px', color: '#4CAF50', fontWeight: 'bold' }}>
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Buyers */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Khách hàng mua nhiều nhất</h3>
          {topBuyers.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              Không có dữ liệu
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Tên khách hàng</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontWeight: 'bold' }}>Email</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold' }}>Số đơn</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold' }}>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {topBuyers.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{item.name}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>{item.email}</td>
                    <td style={{ textAlign: 'right', padding: '12px' }}>{item.orders_count}</td>
                    <td style={{ textAlign: 'right', padding: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                      {formatCurrency(item.total_spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminReports;

import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import ShipmentModal from './ShipmentModal';

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

function formatDate(dt) {
  if (!dt) return '-';
  try {
    return new Date(dt).toLocaleString('vi-VN');
  } catch {
    return String(dt);
  }
}

// Detail Modal Component
function OrderDetailModal({ order, isOpen, onClose, statusLabels, paymentLabels, formatCurrency, formatDate }) {
  if (!isOpen || !order) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Chi tiết đơn hàng #{order.id}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Thông tin khách hàng</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Tên khách hàng</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{order.customer_name || '-'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Email</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{order.customer_email || '-'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Số điện thoại</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{order.customer_phone || '-'}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Địa chỉ giao hàng</h3>
          <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px', minHeight: '60px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, lineHeight: '1.6' }}>
              {order.shipping_address || 'Chưa cập nhật'}
            </p>
          </div>
        </div>

        {/* Order Status & Payment */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Trạng thái đơn hàng</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Trạng thái</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#065f46' }}>{statusLabels[order.status] || order.status || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Thanh toán</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#065f46' }}>{paymentLabels[order.payment_status] || order.payment_status || '-'}</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Phương thức</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#065f46' }}>{order.payment_method || '-'}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Sản phẩm</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ecf6ed' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#999' }}>Sản phẩm</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#999', width: '80px' }}>Loại</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: '#999', width: '70px' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#999', width: '100px' }}>Đơn giá</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#999', width: '100px' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {item.product_avatar && (
                            <img
                              src={item.product_avatar}
                              alt={item.product_name}
                              style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, color: '#333' }}>{item.product_name}</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#999' }}>{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>{item.variant_name || '-'}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#666', fontWeight: 500 }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#333', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Không có sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Notes & Dates */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Ghi chú & thời gian</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Ghi chú</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, minHeight: '40px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                {order.note || '(Không có ghi chú)'}
              </p>
            </div>
            <div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Ngày tạo</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#999', fontWeight: 600 }}>Cập nhật lần cuối</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div style={{ paddingTop: '16px', borderTop: '2px solid #ecf6ed', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#666' }}>Tổng cộng:</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#065f46' }}>{formatCurrency(order.total_price)}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#065f46',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentModalOrder, setShipmentModalOrder] = useState(null);
  const [pendingShipmentOrder, setPendingShipmentOrder] = useState(null);
  const token = localStorage.getItem('token');

  const orderStatusOptions = [
    'pending',
    'confirmed',
    'shipping',
    'delivered',
    'canceled'
  ];
  const paymentStatusOptions = [
    'unpaid',
    'paid',
    'refunded'
  ];
  const statusLabels = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    canceled: 'Đã hủy'
  };
  const paymentLabels = {
    unpaid: 'Chưa thanh toán',
    paid: 'Đã thanh toán',
    refunded: 'Hoàn tiền'
  };

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/getAllOrder', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        console.error('Fetch orders failed', j);
        setOrders([]);
      } else {
        const normalized = (j.data || []).map(o => ({
          id: o.id,
          customer_name: o.customer_name ?? o.user_name ?? o.username ?? (o.user && o.user.name) ?? '-',
          total_price: o.total_price ?? o.total ?? o.totalPrice ?? 0,
          status: (o.status ?? o.order_status ?? '').toString(),
          payment_status: (o.payment_status ?? o.paymentStatus ?? '').toString(),
          shipping_address: o.shipping_address ?? '-',
          updated_at: o.updated_at ?? o.updatedAt ?? o.updated ?? null,
          raw: o
        }));
        setOrders(normalized);
      }
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Fetch order details
  async function fetchOrderDetail(orderId) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/orders/orderDetail/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.success) {
        setSelectedOrder(j.data);
      } else {
        alert('Không thể tải chi tiết đơn hàng');
      }
    } catch (err) {
      console.error('Fetch order detail error:', err);
      alert('Lỗi khi tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  }

  // Handle row click to show detail
  function handleRowClick(order) {
    fetchOrderDetail(order.id);
  }

  // Tìm kiếm đơn hàng
  async function handleSearch(query) {
    if (!query) { fetchOrders(); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/orders/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query })
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.success) {
        const normalized = (j.data || []).map(o => {
          // Xử lý cả single object và array
          const order = Array.isArray(j.data) ? o : j.data;
          return {
            id: order.id,
            customer_name: order.customer_name ?? order.user_name ?? '-',
            total_price: order.total_price ?? 0,
            status: (order.status ?? '').toString(),
            payment_status: (order.payment_status ?? '').toString(),
            shipping_address: order.shipping_address ?? '-',
            updated_at: order.updated_at ?? null,
            raw: order
          };
        });
        setOrders(normalized);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Search error', err);
      alert('Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  }

  function statusStyle(s) {
    const base = {
      padding: '6px 10px',
      borderRadius: 999,
      border: 'none',
      color: '#065f46',
      fontWeight: 600,
      cursor: 'pointer',
      minWidth: 120,
      textTransform: 'capitalize',
      outline: 'none',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      display: 'inline-block',
      backgroundImage: 'linear-gradient(transparent, transparent)',
    };
    const st = String(s || '').toLowerCase();
    switch (st) {
      case 'pending': return { ...base, backgroundColor: '#fef3c7', color: '#92400e' };
      case 'confirmed': return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
      case 'shipping': return { ...base, backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'delivered': return { ...base, backgroundColor: '#ecfdf5', color: '#065f46' };
      case 'canceled': return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
      default: return { ...base, backgroundColor: '#f3f4f6', color: '#111827' };
    }
  }

  function paymentStyle(p) {
    const base = {
      padding: '6px 10px',
      borderRadius: 999,
      border: 'none',
      color: '#065f46',
      fontWeight: 600,
      cursor: 'pointer',
      minWidth: 110,
      textTransform: 'capitalize',
      outline: 'none',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      display: 'inline-block',
    };
    const st = String(p || '').toLowerCase();
    switch (st) {
      case 'unpaid': return { ...base, backgroundColor: '#fff7ed', color: '#7c2d12' };
      case 'paid': return { ...base, backgroundColor: '#ecfdf5', color: '#065f46' };
      case 'refunded': return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
      default: return { ...base, backgroundColor: '#f3f4f6', color: '#111827' };
    }
  }

  async function updateOrder(orderId, { status, payment_status }) {
    if (!token) {
      alert('No auth token. Please login.');
      return;
    }

    // Nếu chuyển sang shipping hoặc delivered, mở modal shipment
    if (status === 'shipping' || status === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      setShipmentModalOrder(orderId);
      setPendingShipmentOrder({ status });
      setShowShipmentModal(true);
      return;
    }

    const body = {};
    if (typeof status !== 'undefined') body.status = status;
    if (typeof payment_status !== 'undefined') body.payment_status = payment_status;

    try {
      const res = await fetch(`/api/orders/updateOrder/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        console.error('Update failed', j);
        alert(j?.message || 'Cập nhật thất bại');
        return;
      }
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...(body.status ? { status: body.status } : {}), ...(body.payment_status ? { payment_status: body.payment_status } : {}), updated_at: (j.data && j.data.updated_at) || new Date().toISOString() } : o)));
      
      // Update modal if it's open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: body.status || prev.status,
          payment_status: body.payment_status || prev.payment_status,
          updated_at: (j.data && j.data.updated_at) || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error(e);
      alert('Cập nhật thất bại');
    }
  }

  const handleShipmentSave = async () => {
    // After shipment is saved, update order status
    if (shipmentModalOrder && pendingShipmentOrder?.status) {
      const body = { status: pendingShipmentOrder.status };
      try {
        const res = await fetch(`/api/orders/updateOrder/${shipmentModalOrder}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        const j = await res.json().catch(() => null);
        if (res.ok) {
          setOrders(prev =>
            prev.map(o =>
              o.id === shipmentModalOrder
                ? { ...o, status: body.status, updated_at: (j.data && j.data.updated_at) || new Date().toISOString() }
                : o
            )
          );
          if (selectedOrder && selectedOrder.id === shipmentModalOrder) {
            setSelectedOrder(prev => ({
              ...prev,
              status: body.status,
              updated_at: (j.data && j.data.updated_at) || new Date().toISOString()
            }));
          }
        }
      } catch (err) {
        console.error('Error updating order status:', err);
      }
    }

    setShowShipmentModal(false);
    setShipmentModalOrder(null);
    setPendingShipmentOrder(null);
  };

  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader title="Quản lý đơn hàng" onSearch={handleSearch}/>
        {loading ? <div>Loading...</div> :
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Tổng tiền</th>
                <th>Địa chỉ giao hàng</th>
                <th>Trạng thái đơn</th>
                <th>Trạng thái thanh toán</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => {
                return (
                  <tr key={o.id}>
                    <td style={{ width: 80 }}>{o.id}</td>
                    <td style={{ width: 150 }}>{o.customer_name}</td>
                    <td>{formatCurrency(o.total_price)}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.shipping_address}>
                      {o.shipping_address}
                    </td>

                    <td>
                      <select
                        value={o.status || ''}
                        onChange={e => updateOrder(o.id, { status: e.target.value })}
                        style={statusStyle(o.status)}
                        aria-label={`Trạng thái đơn ${o.id}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {o.status && <option value={o.status}>{statusLabels[o.status] ?? o.status}</option>}
                        {orderStatusOptions.filter(s => s !== o.status).map(opt => (
                          <option key={opt} value={opt}>{statusLabels[opt] ?? opt}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        value={o.payment_status || ''}
                        onChange={e => updateOrder(o.id, { payment_status: e.target.value })}
                        style={paymentStyle(o.payment_status)}
                        aria-label={`Trạng thái thanh toán ${o.id}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {o.payment_status && <option value={o.payment_status}>{paymentLabels[o.payment_status] ?? o.payment_status}</option>}
                        {paymentStatusOptions.filter(s => s !== o.payment_status).map(opt => (
                          <option key={opt} value={opt}>{paymentLabels[opt] ?? opt}</option>
                        ))}
                      </select>
                    </td>

                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {(o.status === 'shipping' || o.status === 'delivered') && (
                        <button
                          onClick={() => {
                            setShipmentModalOrder(o.id);
                            setShowShipmentModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Quản lý giao vận
                        </button>
                      )}
                      <button
                        onClick={() => handleRowClick(o)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#065f46',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }

        {/* Detail Modal */}
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          statusLabels={statusLabels}
          paymentLabels={paymentLabels}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        {/* Shipment Modal */}
        <ShipmentModal
          orderId={shipmentModalOrder}
          isOpen={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setShipmentModalOrder(null);
          }}
          orderStatus={shipmentModalOrder ? (orders.find(o => o.id === shipmentModalOrder)?.status) : null}
          onSave={handleShipmentSave}
          token={token}
        />
      </main>
    </div>
  );
}
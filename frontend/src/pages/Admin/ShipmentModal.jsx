import React, { useState, useEffect } from 'react';

export default function ShipmentModal({ orderId, isOpen, onClose, orderStatus, onSave, token }) {
  const [formData, setFormData] = useState({
    tracking_number: '',
    carrier: '',
    shipped_date: '',
    delivered_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const carriers = ['GHN', 'GHTK', 'ViettelPost', 'Grab', 'Khác'];

  // Fetch existing shipment data when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchShipmentData();
    }
  }, [isOpen, orderId]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/shipments/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setFormData({
          tracking_number: json.data.tracking_number || '',
          carrier: json.data.carrier || '',
          shipped_date: json.data.shipped_date ? new Date(json.data.shipped_date).toISOString().slice(0, 10) : '',
          delivered_date: json.data.delivered_date ? new Date(json.data.delivered_date).toISOString().slice(0, 10) : ''
        });
      }
    } catch (err) {
      console.error('Fetch shipment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      setLoading(true);

      // Validation - bắt buộc các field cơ bản
      if (!formData.tracking_number || !formData.carrier || !formData.shipped_date) {
        setError('Vui lòng điền đầy đủ: Mã vận đơn, Nhà vận chuyển, Ngày gửi hàng');
        setLoading(false);
        return;
      }

      const payload = {};
      if (formData.tracking_number) payload.tracking_number = formData.tracking_number;
      if (formData.carrier) payload.carrier = formData.carrier;
      if (formData.shipped_date) payload.shipped_date = formData.shipped_date;
      if (formData.delivered_date) payload.delivered_date = formData.delivered_date;

      const res = await fetch(`/api/shipments/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Cập nhật thông tin vận đơn thất bại');
        return;
      }

      setSuccessMsg('Cập nhật thông tin vận đơn thành công');
      setTimeout(() => {
        if (onSave) onSave();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Lỗi khi cập nhật thông tin vận đơn');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            {orderStatus === 'delivered' ? 'Xác nhận giao hàng' : 'Nhập thông tin vận đơn'}
          </h2>
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

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Mã vận đơn *
            </label>
            <input
              type="text"
              name="tracking_number"
              value={formData.tracking_number}
              onChange={handleChange}
              placeholder="VD: 1234567890"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Nhà vận chuyển *
            </label>
            <select
              name="carrier"
              value={formData.carrier}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Chọn nhà vận chuyển --</option>
              {carriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Ngày gửi hàng *
            </label>
            <input
              type="date"
              name="shipped_date"
              value={formData.shipped_date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Ngày giao hàng (tuỳ chọn)
            </label>
            <input
              type="date"
              name="delivered_date"
              value={formData.delivered_date}
              onChange={handleChange}
              placeholder="--/--/--"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                color: formData.delivered_date ? '#000' : '#999'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#065f46',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

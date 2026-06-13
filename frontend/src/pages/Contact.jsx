import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => navigate('/'), 2000);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Lỗi gửi liên hệ!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '2rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2d5016', marginBottom: '1rem' }}>Liên Hệ Với Chúng Tôi</h1>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>Hãy để lại thông tin, chúng tôi sẽ liên lạc với bạn sớm nhất</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Form */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#2d5016', marginBottom: '1.5rem' }}>Gửi Liên Hệ</h2>

            {message.text && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                borderRadius: '4px',
                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                color: message.type === 'success' ? '#155724' : '#721c24'
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Họ và Tên *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nhập họ tên"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Nhập email"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Số Điện Thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nội Dung *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Nhập nội dung chi tiết"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'Arial' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: loading ? '#ccc' : '#2d5016',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Đang gửi...' : 'Gửi Liên Hệ'}
              </button>
            </form>
          </div>

          {/* Info */}
          <div>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#2d5016', marginBottom: '1rem', fontWeight: 'bold' }}>Địa Chỉ</h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '0.95rem', margin: 0 }}>
                Ngõ 91 Tam Khương, nhà số 2. (Số 59 ngõ 354/137 Đường Trường Chinh, P. Khương Thượng, Q. Đống đa, HN.)
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#2d5016', marginBottom: '1rem', fontWeight: 'bold' }}>Số Điện Thoại</h3>
              <p style={{ color: '#2d5016', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>
                <a href="tel:0868839655" style={{ textDecoration: 'none', color: 'inherit' }}>0868839655</a>
                <br />
                <a href="tel:0963538357" style={{ textDecoration: 'none', color: 'inherit' }}>0963538357</a>
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#2d5016', marginBottom: '1rem', fontWeight: 'bold' }}>Giờ Làm Việc</h3>
              <p style={{ color: '#333', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                <strong>Thứ 2 - Chủ nhật:</strong> 9:00 - 18:00
              </p>
              <p style={{ color: '#666', margin: 0, fontSize: '0.85rem' }}>
                (Nghỉ các ngày lễ)
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#2d5016', marginBottom: '0.5rem', fontWeight: 'bold' }}>Phản Hồi</h3>
              <p style={{ color: '#333', margin: 0, fontSize: '0.95rem' }}>
                Chúng tôi sẽ liên lạc với bạn trong <strong>24-48 giờ</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Google Maps */}
        <div style={{ marginTop: '3rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#2d5016', marginBottom: '1rem' }}>Địa Điểm</h2>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.5655849396046!2d105.83779!3d20.982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac6e6f0f0f0f%3A0x1234567890!2sNg%C3%B5%2091%20Tam%20Kh%C6%B0%C6%A1ng!5e0!3m2!1svi!2s!4v1234567890"
            width="100%"
            height="400"
            style={{ border: 'none', borderRadius: '8px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Vị trí cửa hàng"
          />
        </div>
      </div>
    </div>
  );
};

export default Contact;

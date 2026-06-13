import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Distributor = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDistributor();
  }, []);

  const fetchDistributor = async () => {
    try {
      const response = await fetch('/api/blogs/distributor/page');
      const data = await response.json();
      if (data.success) {
        setBlog(data.data);
      }
    } catch (error) {
      console.error('Error fetching distributor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chưa có nội dung tuyển đại lý</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '3px solid #2d5016', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#2d5016', margin: 0 }}>
          {blog.title}
        </h1>
        <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '14px' }}>
          Cập nhật: {new Date(blog.updated_at).toLocaleDateString('vi-VN')}
        </p>
      </div>

      {/* Content - Ảnh float trái, text wrap */}
      <div style={{ position: 'relative' }}>
        {blog.thumbnail_image && (
          <img
            src={blog.thumbnail_image}
            alt={blog.title}
            style={{
              float: 'left',
              maxWidth: '45%',
              height: 'auto',
              maxHeight: '500px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginRight: '2rem',
              marginBottom: '1rem'
            }}
          />
        )}
        <div
          id="blog-content"
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#333',
            textAlign: 'left',
            overflow: 'auto'
          }}
          dangerouslySetInnerHTML={{
            __html: blog.content
              ?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
              .replace(/<img[^>]*>/gi, (img) => {
                const isCentered = img.includes('style="text-align: center');
                if (isCentered) return img;
                return img.replace('<img', '<img style="max-width: 100%; margin: 1rem auto; display: block; border-radius: 4px;"');
              })
          }}
        />
      </div>

      {/* CTA Button */}
      <div
        style={{
          backgroundColor: '#2d5016',
          color: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginTop: '3rem',
          textAlign: 'center'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Hãy để lại thông tin để trở thành đại lý của chúng tôi</h3>
        <button
          onClick={() => navigate('/contact')}
          style={{
            backgroundColor: '#ffa500',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            fontSize: '16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#ff8c00')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#ffa500')}
        >
          Liên hệ ngay
        </button>
      </div>

      <style>{`
        #blog-content > div {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        #blog-content img {
          width: 100%;
          max-width: 100%;
          margin: 1rem 0;
          display: block;
          border-radius: 4px;
        }
        #blog-content div > p {
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          #blog-content {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
};

export default Distributor;

import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import MarkdownEditor from '../../components/MarkdownEditor';
import { uploadToCloudinary } from '../../services/cloudinary';

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    thumbnail_image: '',
    status: 'draft'
  });
  const contentRef = React.useRef(null);
  const thumbnailFileRef = React.useRef(null);
  const contentImageFileRef = React.useRef(null);

  const categories = [
    { value: 'general', label: 'Tổng hợp' },
    { value: 'promotion', label: 'Khuyến mãi' },
    { value: 'news', label: 'Tin tức' },
    { value: 'guide', label: 'Hướng dẫn' },
    { value: 'tips', label: 'Mẹo' },
    { value: 'other', label: 'Khác' }
  ];

  const getCategoryLabel = (value) => {
    const category = categories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blogs/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBlogs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      thumbnail_image: '',
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleEdit = (blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      thumbnail_image: blog.thumbnail_image || '',
      status: blog.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/blogs/${editingId}`
        : '/api/blogs/create';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(editingId ? 'Cập nhật bài viết thành công' : 'Tạo bài viết thành công');
        setShowModal(false);
        fetchBlogs();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Có lỗi xảy ra khi lưu bài viết');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa bài viết thành công');
        fetchBlogs();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  const handleInsertImage = () => {
    const imageUrl = prompt('Nhập URL ảnh:');
    if (imageUrl) {
      const altText = prompt('Nhập mô tả ảnh (alt text):') || 'image';
      const imgTag = `<div style="text-align: center; margin: 1rem 0;"><img src="${imageUrl}" alt="${altText}" style="max-width: 100%; border-radius: 4px;"><p style="margin: 0.5rem 0 0; color: #666; font-size: 14px;">${altText}</p></div>`;
      
      // Lấy vị trí cursor
      const textarea = contentRef?.current;
      if (textarea) {
        try {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const before = formData.content.substring(0, start);
          const after = formData.content.substring(end);
          
          const newContent = before + '\n' + imgTag + '\n' + after;
          setFormData(prev => ({
            ...prev,
            content: newContent
          }));
          
          // Focus lại textarea
          setTimeout(() => {
            textarea.focus();
            const newPos = start + imgTag.length + 2;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        } catch (e) {
          console.error('Error inserting image:', e);
        }
      } else {
        // Fallback nếu ref không available
        setFormData(prev => ({
          ...prev,
          content: prev.content + '\n' + imgTag + '\n'
        }));
      }
    }
  };

  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('Đang upload thumbnail blog...');
        const result = await uploadToCloudinary(file);
        setFormData(prev => ({
          ...prev,
          thumbnail_image: result.secure_url
        }));
        console.log('Upload thumbnail thành công');
        alert('Upload ảnh thành công!');
      } catch (error) {
        console.error('Lỗi upload thumbnail:', error);
        alert(`Upload ảnh thất bại:\n${error.message}`);
      }
    }
  };

  const handleInsertThumbnailImage = () => {
    const imageUrl = prompt('Nhập URL ảnh thumbnail:');
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        thumbnail_image: imageUrl
      }));
    }
  };

  const handleUploadContentImage = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('Đang upload ảnh nội dung...');
        const result = await uploadToCloudinary(file);
        const altText = prompt('Nhập mô tả ảnh (alt text):') || 'image';
        const imgTag = `<div style="text-align: center; margin: 1rem 0;"><img src="${result.secure_url}" alt="${altText}" style="max-width: 100%; border-radius: 4px;"><p style="margin: 0.5rem 0 0; color: #666; font-size: 14px;">${altText}</p></div>`;
        
        const textarea = contentRef?.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const before = formData.content.substring(0, start);
          const after = formData.content.substring(end);

          setFormData(prev => ({
            ...prev,
            content: before + '\n' + imgTag + '\n' + after
          }));

          setTimeout(() => {
            textarea.focus();
            const newPos = start + imgTag.length + 2;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
        console.log('Upload ảnh nội dung thành công');
      } catch (error) {
        console.error('Lỗi upload ảnh nội dung:', error);
        alert(`Upload ảnh thất bại:\n${error.message}`);
      }
    }
  };


  return (
    <div className="admin-root">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader
          title="Quản lý bài viết"
          onSearch={(q) => setSearchTerm(q)}
          onCreate={handleCreate}
        />

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
            Đang tải...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
            Không có bài viết nào
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map(blog => (
                <tr key={blog.id}>
                  <td>{blog.id}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {blog.title}
                  </td>
                  <td>{getCategoryLabel(blog.category)}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: blog.status === 'published' ? '#4caf50' : '#ffc107',
                      color: blog.status === 'published' ? '#fff' : '#333'
                    }}>
                      {blog.status === 'published' ? 'Đã phát hành' : 'Nháp'}
                    </span>
                  </td>
                  <td>{blog.view_count || 0}</td>
                  <td>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(blog)}
                      className="btn btn-sm"
                      style={{ marginRight: 8 }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="btn btn-sm"
                      style={{ background: '#f44336', color: '#fff' }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60
          }}>
            <div style={{
              width: 600,
              maxWidth: '98%',
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 24,
              maxHeight: '95vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: '#145214' }}>
                {editingId ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
              </h2>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', minWidth: 0 }}
                    placeholder="Nhập tiêu đề bài viết"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                    Nội dung *
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={handleInsertImage}
                      className="btn btn-sm"
                      style={{ background: '#2196F3', color: '#fff', padding: '6px 12px' }}
                    >
                      � Chèn URL ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => contentImageFileRef.current?.click()}
                      className="btn btn-sm"
                      style={{ background: '#4CAF50', color: '#fff', padding: '6px 12px' }}
                    >
                      📤 Upload ảnh
                    </button>
                    <input ref={contentImageFileRef} type="file" accept="image/*" onChange={handleUploadContentImage} style={{ display: 'none' }} />
                  </div>
                  <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <MarkdownEditor
                      value={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Nhập nội dung bài viết (Hỗ trợ Markdown)..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                      Danh mục
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="search-input"
                      style={{ width: '100%', minWidth: 0 }}
                    >
                      <option value="general">Tổng hợp</option>
                      <option value="promotion">Khuyến mãi</option>
                      <option value="news">Tin tức</option>
                      <option value="tutorial">Hướng dẫn</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="search-input"
                      style={{ width: '100%', minWidth: 0 }}
                    >
                      <option value="draft">Nháp</option>
                      <option value="published">Đã phát hành</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold' }}>
                    Ảnh thumbnail
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={() => thumbnailFileRef.current?.click()} 
                      className="btn btn-sm" 
                      style={{ background: '#4CAF50', color: '#fff', padding: '6px 12px' }}
                    >
                      📤 Upload ảnh
                    </button>
                    <button 
                      type="button" 
                      onClick={handleInsertThumbnailImage}
                      className="btn btn-sm" 
                      style={{ background: '#2196F3', color: '#fff', padding: '6px 12px' }}
                    >
                      🔗 Chèn URL
                    </button>
                    <input ref={thumbnailFileRef} type="file" accept="image/*" onChange={handleUploadThumbnail} style={{ display: 'none' }} />
                  </div>
                  {formData.thumbnail_image && (
                    <div style={{ marginBottom: 12 }}>
                      <img src={formData.thumbnail_image} alt="thumbnail" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                >
                  {editingId ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBlogs;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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

  useEffect(() => {
    fetchBlogDetail();
  }, [id]);

  const fetchBlogDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blogs/${id}`);
      const data = await response.json();
      if (data.success) {
        setBlog(data.data);
        setComments(data.data.comments || []);
      } else {
        navigate('/blog');
      }
    } catch (error) {
      console.error('Error fetching blog detail:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!commentContent.trim()) {
      alert('Vui lòng nhập nội dung bình luận');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/blogs/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: commentContent })
      });

      const data = await response.json();
      if (data.success) {
        setCommentContent('');
        fetchBlogDetail();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Có lỗi xảy ra khi thêm bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500 text-lg">Đang tải...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500 text-lg">Bài viết không tìm thấy</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back button */}
      <Link
        to="/blog"
        className="text-blue-500 hover:text-blue-600 mb-6 inline-flex items-center"
      >
        ← Quay lại danh sách
      </Link>

        {/* Blog Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded">
                {getCategoryLabel(blog.category)}
              </span>
              <span className="text-sm text-gray-500">
                👁 {blog.view_count || 0} lượt xem
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(blog.created_at).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">{blog.title}</h1>

          {blog.thumbnail_image && (
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden mb-6" style={{ display: 'none' }}>
              <img
                src={blog.thumbnail_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Blog Content */}
        <div 
          id="blog-content"
          className="max-w-none mb-12"
          dangerouslySetInnerHTML={{
            __html: blog.content
          }}
          style={{
            fontSize: '18px',
            lineHeight: '1.8',
            color: '#333'
          }}
        />
        <style>{`
          #blog-content {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          #blog-content > div {
            text-align: center !important;
            margin: 1rem 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          
          #blog-content img {
            display: block !important;
            margin: 0 auto !important;
            width: 50% !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 4px !important;
          }
          
          #blog-content div > p {
            margin: 0.5rem auto 0 !important;
            color: #666 !important;
            font-size: 14px !important;
            text-align: center !important;
            max-width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          
          #blog-content p {
            margin-bottom: 1rem;
            text-align: left;
          }
          
          #blog-content b, #blog-content strong {
            font-weight: bold;
          }
          
          #blog-content i, #blog-content em {
            font-style: italic;
          }
          
          #blog-content u {
            text-decoration: underline;
          }
          
          #blog-content h1, #blog-content h2, #blog-content h3, #blog-content h4, #blog-content h5, #blog-content h6 {
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            font-weight: bold;
          }
          
          #blog-content h1 { font-size: 2rem; }
          #blog-content h2 { font-size: 1.5rem; }
          #blog-content h3 { font-size: 1.25rem; }
          
          #blog-content ul {
            margin: 1rem 0;
            padding-left: 2rem;
          }
          
          #blog-content ol {
            margin: 1rem 0;
            padding-left: 2rem;
          }
          
          #blog-content li {
            margin: 0.5rem 0;
          }
        `}</style>

        <hr className="my-12" />

        {/* Comments Section */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Bình luận ({comments.length})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <div className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Chia sẻ ý kiến của bạn..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={submittingComment}
                className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
              </button>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <Link to="/login" className="font-semibold hover:underline">
                  Đăng nhập
                </Link>{' '}
                để bình luận
              </p>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có bình luận nào
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{comment.user_name}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-gray-600">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default BlogDetail;

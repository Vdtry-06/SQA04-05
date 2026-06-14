import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blogs/all');
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

  // Lọc bài viết
  let filteredBlogs = blogs.filter(blog =>
    (blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchTerm.toLowerCase())) &&
    blog.category !== 'about' // Loại bỏ bài "about"
  );

  if (selectedCategory !== 'all') {
    filteredBlogs = filteredBlogs.filter(blog => blog.category === selectedCategory);
  }

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

  const truncateContent = (content, maxLength = 150) => {
    // Remove HTML tags first
    let cleanContent = content.replace(/<[^>]*>/g, '');
    if (cleanContent.length > maxLength) {
      return cleanContent.substring(0, maxLength) + '...';
    }
    return cleanContent;
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Blog List */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500 text-lg">Đang tải bài viết...</div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500 text-lg">Không tìm thấy bài viết nào</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map(blog => (
              <Link key={blog.id} to={`/blog/${blog.id}`}>
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer h-full flex flex-col">
                  {/* Thumbnail */}
                  {blog.thumbnail_image && (
                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={blog.thumbnail_image}
                        alt={blog.title}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {getCategoryLabel(blog.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        👁 {blog.view_count || 0}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {truncateContent(blog.content)}
                    </p>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {new Date(blog.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span>💬 {blog.comment_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

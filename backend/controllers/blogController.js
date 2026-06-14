const blogService = require('../services/blogService');
const { updateBlogInRAG, deleteBlogFromRAG } = require('../services/ragService');

/**
 * Blog Controller - Xử lý request liên quan đến bài viết
 */

// Lấy tất cả bài viết
const getAllBlogs = async (req, res) => {
  try {
    const result = await blogService.getAllBlogs();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài viết',
      error: error.message
    });
  }
};

// Lấy bài viết chi tiết
const getBlogDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.getBlogDetail(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết bài viết',
      error: error.message
    });
  }
};

// Tìm kiếm bài viết
const searchBlogs = async (req, res) => {
  try {
    const { keyword } = req.query;
    const result = await blogService.searchBlogs(keyword);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm bài viết',
      error: error.message
    });
  }
};

// Lấy bài viết theo danh mục
const getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const result = await blogService.getBlogsByCategory(category);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bài viết theo danh mục',
      error: error.message
    });
  }
};

// Lấy bài "About Us"
const getAboutPage = async (req, res) => {
  try {
    const result = await blogService.getBlogsByCategory('about');
    // Lấy bài đầu tiên nếu có
    if (result.success && result.data && result.data.length > 0) {
      return res.status(200).json({
        success: true,
        data: result.data[0]
      });
    }
    res.status(404).json({
      success: false,
      message: 'Chưa có nội dung About'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trang About',
      error: error.message
    });
  }
};

// Lấy bài "Tuyển đại lý"
const getDistributorPage = async (req, res) => {
  try {
    const result = await blogService.getBlogsByCategory('distributor');
    // Lấy bài đầu tiên nếu có
    if (result.success && result.data && result.data.length > 0) {
      return res.status(200).json({
        success: true,
        data: result.data[0]
      });
    }
    res.status(404).json({
      success: false,
      message: 'Chưa có nội dung Tuyển đại lý'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trang Tuyển đại lý',
      error: error.message
    });
  }
};

// ============ ADMIN OPERATIONS ============

// Lấy tất cả bài viết (admin)
const getAllBlogsAdmin = async (req, res) => {
  try {
    const result = await blogService.getAllBlogsAdmin();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài viết',
      error: error.message
    });
  }
};

// Tạo bài viết
const createBlog = async (req, res) => {
  try {
    const { title, content, category, thumbnail_image, status } = req.body;
    
    const result = await blogService.createBlog({
      title,
      content,
      category,
      thumbnail_image,
      status: status || 'draft'
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Fire & forget: Add new blog to RAG vector DB in background
    if (result.data && result.data.id) {
      updateBlogInRAG(result.data.id).catch(err => {
        console.error('[Blog Controller] RAG index failed:', err.message);
      });
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bài viết',
      error: error.message
    });
  }
};

// Cập nhật bài viết
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, thumbnail_image, status } = req.body;
    
    const result = await blogService.updateBlog(id, {
      title,
      content,
      category,
      thumbnail_image,
      status
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Fire & forget: Update RAG vector DB in background
    updateBlogInRAG(id).catch(err => {
      console.error('[Blog Controller] RAG update failed:', err.message);
    });
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bài viết',
      error: error.message
    });
  }
};

// Xóa bài viết
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blogService.deleteBlog(id);
    
    // Fire & forget: Remove blog from RAG vector DB in background
    if (result.success) {
      deleteBlogFromRAG(id).catch(err => {
        console.error('[Blog Controller] RAG delete failed:', err.message);
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài viết',
      error: error.message
    });
  }
};

// Thêm comment
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để bình luận'
      });
    }
    
    const result = await blogService.addComment(id, userId, content);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm comment',
      error: error.message
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogDetail,
  searchBlogs,
  getBlogsByCategory,
  getAboutPage,
  getDistributorPage,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment
};

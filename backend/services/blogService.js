const blogModel = require('../models/blogModel');

/**
 * Blog Service - Xử lý logic liên quan đến bài viết
 */

// Lấy tất cả bài viết đã phát hành
async function getAllBlogs() {
  try {
    const blogs = await blogModel.findAll();
    return {
      success: true,
      data: blogs || [],
      message: 'Lấy danh sách bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Lấy bài viết chi tiết
async function getBlogDetail(blogId) {
  try {
    const blog = await blogModel.findById(blogId);
    
    if (!blog) {
      return {
        success: false,
        message: 'Bài viết không tìm thấy',
        data: null
      };
    }
    
    const comments = await blogModel.getComments(blogId);
    
    return {
      success: true,
      data: {
        ...blog,
        comments: comments || []
      },
      message: 'Lấy chi tiết bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Tìm kiếm bài viết
async function searchBlogs(keyword) {
  try {
    if (!keyword || keyword.trim() === '') {
      return await getAllBlogs();
    }
    
    const blogs = await blogModel.searchBlogs(keyword);
    return {
      success: true,
      data: blogs || [],
      message: 'Tìm kiếm bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Lấy bài viết theo danh mục
async function getBlogsByCategory(category) {
  try {
    const blogs = await blogModel.findByCategory(category);
    return {
      success: true,
      data: blogs || [],
      message: 'Lấy bài viết theo danh mục thành công'
    };
  } catch (error) {
    throw error;
  }
}

// ============ ADMIN OPERATIONS ============

// Lấy tất cả bài viết (bao gồm draft)
async function getAllBlogsAdmin() {
  try {
    const blogs = await blogModel.findAllAdmin();
    return {
      success: true,
      data: blogs || [],
      message: 'Lấy danh sách bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Tạo bài viết mới
async function createBlog(blogData) {
  try {
    if (!blogData.title || !blogData.content) {
      return {
        success: false,
        message: 'Tiêu đề và nội dung bài viết không được trống',
        data: null
      };
    }
    
    const blog = await blogModel.create(blogData);
    return {
      success: true,
      data: blog,
      message: 'Tạo bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Cập nhật bài viết
async function updateBlog(blogId, blogData) {
  try {
    if (!blogData.title || !blogData.content) {
      return {
        success: false,
        message: 'Tiêu đề và nội dung bài viết không được trống',
        data: null
      };
    }
    
    const blog = await blogModel.update(blogId, blogData);
    return {
      success: true,
      data: blog,
      message: 'Cập nhật bài viết thành công'
    };
  } catch (error) {
    throw error;
  }
}

// Xóa bài viết
async function deleteBlog(blogId) {
  try {
    const result = await blogModel.remove(blogId);
    return {
      success: result,
      message: result ? 'Xóa bài viết thành công' : 'Xóa bài viết thất bại',
      data: null
    };
  } catch (error) {
    throw error;
  }
}

// Thêm comment
async function addComment(blogId, userId, content) {
  try {
    if (!content || content.trim() === '') {
      return {
        success: false,
        message: 'Nội dung comment không được trống',
        data: null
      };
    }
    
    const comment = await blogModel.addComment(blogId, userId, content);
    return {
      success: true,
      data: comment,
      message: 'Thêm comment thành công'
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllBlogs,
  getBlogDetail,
  searchBlogs,
  getBlogsByCategory,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment
};

const { pool } = require('../config/mysql');

/**
 * Blog Model - Quản lý bài viết (tin tức)
 */

// Lấy tất cả bài viết (đã phát hành)
async function findAll() {
  const query = `
    SELECT 
      b.id, 
      b.title, 
      b.content, 
      b.category, 
      b.thumbnail_image, 
      b.status,
      b.view_count,
      b.created_at,
      b.updated_at,
      (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id) as comment_count
    FROM blogs b
    WHERE b.status = 'published'
    ORDER BY b.created_at DESC
  `;
  
  try {
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Lấy bài viết theo ID
async function findById(blogId) {
  const query = `
    SELECT 
      b.id, 
      b.title, 
      b.content, 
      b.category, 
      b.thumbnail_image, 
      b.status,
      b.view_count,
      b.created_at,
      b.updated_at
    FROM blogs b
    WHERE b.id = ?
  `;
  
  try {
    const [rows] = await pool.query(query, [blogId]);
    if (rows.length === 0) return null;
    
    // Tăng view count
    await pool.query('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?', [blogId]);
    
    return rows[0];
  } catch (error) {
    throw error;
  }
}

// Tìm kiếm bài viết theo tiêu đề/nội dung
async function searchBlogs(keyword) {
  const query = `
    SELECT 
      b.id, 
      b.title, 
      b.content, 
      b.category, 
      b.thumbnail_image, 
      b.status,
      b.view_count,
      b.created_at,
      b.updated_at
    FROM blogs b
    WHERE b.status = 'published' 
      AND (b.title LIKE ? OR b.content LIKE ?)
    ORDER BY b.created_at DESC
  `;
  
  const searchTerm = `%${keyword}%`;
  
  try {
    const [rows] = await pool.query(query, [searchTerm, searchTerm]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Lấy bài viết theo category
async function findByCategory(category) {
  const query = `
    SELECT 
      b.id, 
      b.title, 
      b.content, 
      b.category, 
      b.thumbnail_image, 
      b.status,
      b.view_count,
      b.created_at,
      b.updated_at
    FROM blogs b
    WHERE b.status = 'published' AND b.category = ?
    ORDER BY b.created_at DESC
  `;
  
  try {
    const [rows] = await pool.query(query, [category]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Lấy tất cả bài viết cho admin (bao gồm cả draft/unpublished)
async function findAllAdmin() {
  const query = `
    SELECT 
      b.id, 
      b.title, 
      b.content, 
      b.category, 
      b.thumbnail_image, 
      b.status,
      b.view_count,
      b.created_at,
      b.updated_at
    FROM blogs b
    ORDER BY b.created_at DESC
  `;
  
  try {
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Tạo bài viết mới
async function create(blogData) {
  const { title, content, category, thumbnail_image, status } = blogData;
  
  const query = `
    INSERT INTO blogs (title, content, category, thumbnail_image, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;
  
  try {
    const [result] = await pool.query(query, [
      title,
      content,
      category || 'general',
      thumbnail_image || null,
      status || 'draft'
    ]);
    
    return {
      id: result.insertId,
      ...blogData,
      created_at: new Date(),
      updated_at: new Date()
    };
  } catch (error) {
    throw error;
  }
}

// Cập nhật bài viết
async function update(blogId, blogData) {
  const { title, content, category, thumbnail_image, status } = blogData;
  
  const query = `
    UPDATE blogs 
    SET title = ?, content = ?, category = ?, thumbnail_image = ?, status = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  try {
    await pool.query(query, [
      title,
      content,
      category || 'general',
      thumbnail_image || null,
      status || 'draft',
      blogId
    ]);
    
    return { id: blogId, ...blogData, updated_at: new Date() };
  } catch (error) {
    throw error;
  }
}

// Xóa bài viết
async function remove(blogId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Xóa comments
    await connection.query('DELETE FROM blog_comments WHERE blog_id = ?', [blogId]);
    
    // Xóa images
    await connection.query('DELETE FROM blog_images WHERE blog_id = ?', [blogId]);
    
    // Xóa blog
    await connection.query('DELETE FROM blogs WHERE id = ?', [blogId]);
    
    await connection.commit();
    
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Lấy comments của bài viết
async function getComments(blogId) {
  const query = `
    SELECT 
      bc.id,
      bc.user_id,
      u.name as user_name,
      bc.content,
      bc.created_at
    FROM blog_comments bc
    JOIN users u ON bc.user_id = u.id
    WHERE bc.blog_id = ?
    ORDER BY bc.created_at DESC
  `;
  
  try {
    const [rows] = await pool.query(query, [blogId]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Thêm comment vào bài viết
async function addComment(blogId, userId, content) {
  const query = `
    INSERT INTO blog_comments (blog_id, user_id, content, created_at)
    VALUES (?, ?, ?, NOW())
  `;
  
  try {
    const [result] = await pool.query(query, [blogId, userId, content]);
    return {
      id: result.insertId,
      blog_id: blogId,
      user_id: userId,
      content,
      created_at: new Date()
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  searchBlogs,
  findByCategory,
  findAllAdmin,
  create,
  update,
  remove,
  getComments,
  addComment
};

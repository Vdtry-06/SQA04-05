// ...existing code...
const { pool } = require('../config/mysql');

// Lấy tất cả categories
async function findAll() {
  const [rows] = await pool.query(`
    SELECT id, name
    FROM categories
    ORDER BY id ASC
  `);
  return rows;
}

// Lấy category theo ID
async function findById(id) {
  const [rows] = await pool.query(`
    SELECT id, name, parent_id
    FROM categories
    WHERE id = ?
  `, [id]);
  return rows[0] || null;
}

// Tạo category mới
async function createCategory(name, parentId = null) {
  const [result] = await pool.query(`
    INSERT INTO categories (name, parent_id)
    VALUES (?, ?)
  `, [name, parentId]);
  return result;
}

// Cập nhật category
async function updateCategory(id, name, parentId = null) {
  const [result] = await pool.query(`
    UPDATE categories
    SET name = ?, parent_id = ?
    WHERE id = ?
  `, [name, parentId, id]);
  return result;
}

// Xóa category
async function deleteCategory(id) {
  const [result] = await pool.query(`
    DELETE FROM categories
    WHERE id = ?
  `, [id]);
  return result;
}

module.exports = {
  findAll,
  findById,
  createCategory,
  updateCategory,
  deleteCategory
};
// ...existing code...
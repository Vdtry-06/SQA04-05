const { pool } = require('../config/mysql');

// Lấy tất cả suppliers
async function findAll() {
  const [rows] = await pool.query(`
    SELECT id, name, contact_info, address
    FROM suppliers
    ORDER BY id ASC
  `);
  return rows;
}

// Lấy supplier theo ID
async function findById(id) {
  const [rows] = await pool.query(`
    SELECT id, name, contact_info, address
    FROM suppliers
    WHERE id = ?
  `, [id]);
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById
};
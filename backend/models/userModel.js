const { pool } = require('../config/mysql');

async function findAll() {
  const [rows] = await pool.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateById(id, data) {
  const fields = [];
  const values = [];
  
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  
  if (fields.length === 0) return null;
  
  fields.push('updated_at = NOW()');
  values.push(id);
  
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await pool.query(sql, values);
  
  return await findById(id);
}

async function findByIdWithPassword(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updatePassword(id, hashedPassword) {
  const sql = `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`;
  await pool.query(sql, [hashedPassword, id]);
  return await findById(id);
}

module.exports = {
  findAll,
  findById,
  updateById,
  findByIdWithPassword,
  updatePassword
};

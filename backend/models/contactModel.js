const { pool } = require('../config/mysql');

const contact = {
  create: async (data) => {
    const query = `
      INSERT INTO contact_requests (name, email, phone, message)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      data.name,
      data.email,
      data.phone || null,
      data.message
    ]);
    return result;
  },

  getAll: async () => {
    const query = `
      SELECT id, name, email, phone, message, status, created_at
      FROM contact_requests
      ORDER BY created_at DESC
    `;
    const [results] = await pool.query(query);
    return results;
  },

  getById: async (id) => {
    const query = `
      SELECT id, name, email, phone, message, status, created_at
      FROM contact_requests
      WHERE id = ?
    `;
    const [results] = await pool.execute(query, [id]);
    return results;
  },

  delete: async (id) => {
    const query = 'DELETE FROM contact_requests WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  },

  updateStatus: async (id, status) => {
    const query = 'UPDATE contact_requests SET status = ? WHERE id = ?';
    const [result] = await pool.execute(query, [status, id]);
    return result;
  }
};

module.exports = contact;

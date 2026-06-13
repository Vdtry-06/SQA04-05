const { pool } = require('../config/mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

function signToken(user) {
  // chỉ ký user id (frontend sẽ gọi /me để lấy role từ DB)
  const payload = { id: user.id };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query('SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, phone, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();

  const insertSql = `INSERT INTO users (name, email, password, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`;
  const [res] = await pool.query(insertSql, [name || null, email, hashed, phone || null, now, now]);
  const userId = res.insertId;

  const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', ['customer']);
  let roleId = (roleRows && roleRows[0] && roleRows[0].id) ? roleRows[0].id : null;

  if (!roleId) {
    const [ins] = await pool.query('INSERT INTO roles (name) VALUES (?)', ['customer']);
    roleId = ins.insertId;
  }

  await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

  return findUserById(userId);
}

async function verifyPassword(email, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0] || null;
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  // return minimal user info (role not included here since token will be id-only)
  return { id: user.id, email: user.email, name: user.name, phone: user.phone };
}

/**
 * Lấy tất cả role names của user (mảng)
 */
async function getRolesByUserId(userId) {
  const [rrows] = await pool.query(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [userId]
  );
  return (rrows || []).map(r => r.name);
}

/**
 * Tạo reset token và lưu vào database
 */
async function createResetToken(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('No user found with that email');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // Tạo random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token hết hạn sau 30 phút
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Lưu vào database
  await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, token, expiresAt]
  );

  return { token, email: user.email };
}

/**
 * Xác thực reset token
 */
async function verifyResetToken(token) {
  const [rows] = await pool.query(
    `SELECT pr.*, u.email, u.id as user_id 
     FROM password_resets pr 
     JOIN users u ON pr.user_id = u.id 
     WHERE pr.token = ? AND pr.expires_at > NOW()`,
    [token]
  );

  if (!rows || rows.length === 0) {
    const err = new Error('Invalid or expired reset token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  return rows[0];
}

/**
 * Cập nhật password mới
 */
async function updatePassword(token, newPassword) {
  const resetRecord = await verifyResetToken(token);
  
  // Hash password mới
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  // Cập nhật password
  await pool.query(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
    [hashedPassword, resetRecord.user_id]
  );

  // Xóa token đã sử dụng
  await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);

  return { success: true };
}

/**
 * Xóa các token hết hạn (có thể chạy định kỳ)
 */
async function cleanupExpiredTokens() {
  await pool.query('DELETE FROM password_resets WHERE expires_at < NOW()');
}

module.exports = {
  signToken,
  findUserByEmail,
  createUser,
  verifyPassword,
  findUserById,
  getRolesByUserId,
  createResetToken,
  verifyResetToken,
  updatePassword,
  cleanupExpiredTokens
};
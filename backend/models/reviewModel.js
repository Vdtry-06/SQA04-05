const { pool } = require('../config/mysql');

async function findByProductId(productId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.user_id, u.name AS user_name, r.product_id, r.rating, r.comment, r.created_at
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return rows;
}

async function getStatsByProductId(productId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS review_count, AVG(rating) AS avg_rating
     FROM reviews WHERE product_id = ?`,
    [productId]
  );
  return {
    review_count: rows[0]?.review_count ? Number(rows[0].review_count) : 0,
    avg_rating: rows[0]?.avg_rating ? Number(rows[0].avg_rating) : 0,
  };
}

async function findByUserAndProduct(userId, productId) {
  const [rows] = await pool.query(
    `SELECT * FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1`,
    [userId, productId]
  );
  return rows[0] || null;
}

async function create({ user_id, product_id, rating, comment }) {
  const [result] = await pool.query(
    `INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [user_id, product_id, rating, comment]
  );
  return { id: result.insertId, user_id, product_id, rating, comment };
}

async function update(reviewId, { rating, comment }) {
  await pool.query(
    `UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE id = ?`,
    [rating, comment, reviewId]
  );
  const [rows] = await pool.query(`SELECT * FROM reviews WHERE id = ?`, [reviewId]);
  return rows[0] || null;
}

module.exports = {
  findByProductId,
  getStatsByProductId,
  findByUserAndProduct,
  create,
  update,
};


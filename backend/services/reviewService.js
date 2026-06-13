const reviewModel = require('../models/reviewModel');
const { pool } = require('../config/mysql');

async function canUserReview(userId, productId, variantId) {
  // Accept either a specific variantId or a productId. Status check is case-insensitive.
  if (variantId) {
    const [rows] = await pool.query(
      `SELECT 1
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND LOWER(o.status) = 'delivered' AND oi.product_variant_id = ?
       LIMIT 1`,
      [userId, variantId]
    );
    if (rows.length > 0) return true;
  }

  const [rows] = await pool.query(
    `SELECT 1
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN product_variants pv ON oi.product_variant_id = pv.id
     WHERE o.user_id = ? AND LOWER(o.status) = 'delivered' AND pv.product_id = ?
     LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

async function addOrUpdateReview(userId, productId, rating, comment, variantId) {
  // Rating validation should already be done in controller
  const eligible = await canUserReview(userId, productId, variantId);
  if (!eligible) return { ok: false, reason: 'NOT_ELIGIBLE' };

  const existing = await reviewModel.findByUserAndProduct(userId, productId);
  const safeComment = String(comment ?? '').trim();
  let saved;
  if (existing) {
    saved = await reviewModel.update(existing.id, { rating, comment: safeComment });
  } else {
    saved = await reviewModel.create({ user_id: userId, product_id: productId, rating, comment: safeComment });
  }

  const [reviews, stats] = await Promise.all([
    reviewModel.findByProductId(productId),
    reviewModel.getStatsByProductId(productId),
  ]);

  return { ok: true, review: saved, reviews, stats };
}

async function getReviewsForProduct(productId) {
  const [reviews, stats] = await Promise.all([
    reviewModel.findByProductId(productId),
    reviewModel.getStatsByProductId(productId),
  ]);
  return { reviews, stats };
}

module.exports = {
  canUserReview,
  addOrUpdateReview,
  getReviewsForProduct,
  addOrUpdateReviewFromOrder,
  getOrderReviewStatus,
};


// From order context: ensure the given order belongs to user and is delivered and includes the variant
async function addOrUpdateReviewFromOrder(userId, orderId, variantId, rating, comment) {
  const [rows] = await pool.query(
    `SELECT pv.product_id,
            o.updated_at AS delivered_at,
            DATEDIFF(CURDATE(), DATE(o.updated_at)) AS days_since_delivery
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN product_variants pv ON pv.id = oi.product_variant_id
     WHERE o.id = ? AND o.user_id = ? AND LOWER(o.status) = 'delivered' AND oi.product_variant_id = ?
     LIMIT 1`,
    [orderId, userId, variantId]
  );
  if (rows.length === 0) return { ok: false, reason: 'NOT_ELIGIBLE' };

  const productId = rows[0].product_id;
  const daysSince = Number(rows[0].days_since_delivery ?? 9999);
  if (Number.isFinite(daysSince) && daysSince >= 30) {
    return { ok: false, reason: 'WINDOW_EXPIRED', days_since: daysSince };
  }

  const existing = await reviewModel.findByUserAndProduct(userId, productId);
  const safeComment = String(comment ?? '').trim();
  let saved;
  if (existing) {
    saved = await reviewModel.update(existing.id, { rating, comment: safeComment });
  } else {
    saved = await reviewModel.create({ user_id: userId, product_id: productId, rating, comment: safeComment });
  }

  const [reviews, stats] = await Promise.all([
    reviewModel.findByProductId(productId),
    reviewModel.getStatsByProductId(productId),
  ]);

  return { ok: true, review: saved, reviews, stats };
}

// Get per-order review status and days remaining window
async function getOrderReviewStatus(userId, orderId) {
  // First, get order status and updated_at for the delivery window
  const [orderRows] = await pool.query(
    `SELECT o.status, o.updated_at,
            DATEDIFF(CURDATE(), DATE(o.updated_at)) AS days_since_delivery
     FROM orders o
     WHERE o.id = ? AND o.user_id = ?
     LIMIT 1`,
    [orderId, userId]
  );
  if (orderRows.length === 0) {
    return { found: false };
  }
  const o = orderRows[0];
  const delivered = String(o.status || '').toLowerCase() === 'delivered';
  const daysSince = delivered ? Number(o.days_since_delivery ?? 9999) : null;
  const daysRemaining = delivered && Number.isFinite(daysSince) ? Math.max(0, 30 - daysSince) : null;
  const windowOpen = delivered && Number.isFinite(daysSince) && daysSince < 30;

  // Then, map each item (variant/product) and whether user has already reviewed that product
  // Reviewed is true only if the user updated/created a review AFTER the order was delivered
  const [itemRows] = await pool.query(
    `SELECT oi.product_variant_id AS variant_id,
            pv.product_id AS product_id,
            EXISTS(
              SELECT 1 FROM reviews r
              WHERE r.user_id = ?
                AND r.product_id = pv.product_id
                AND r.created_at >= o.updated_at
            ) AS reviewed
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN product_variants pv ON pv.id = oi.product_variant_id
     WHERE o.id = ? AND o.user_id = ?
     ORDER BY oi.id`,
    [userId, orderId, userId]
  );

  const items = itemRows.map(r => ({
    variant_id: r.variant_id,
    product_id: r.product_id,
    reviewed: !!r.reviewed,
  }));

  return {
    found: true,
    delivered,
    days_since_delivery: daysSince,
    days_remaining: daysRemaining,
    window_open: windowOpen,
    items,
  };
}



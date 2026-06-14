const { pool } = require('../config/mysql');

/**
 * GET /api/reports/top-products?limit=3&start=2025-01-01&end=2025-12-31
 * trả về top N sản phẩm theo tổng doanh thu (sum(quantity*price))
 */
async function topProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit || '3', 10);
    const start = req.query.start;
    const end = req.query.end;

    let where = "WHERE o.payment_status = 'paid' AND o.status = 'delivered'";
    const params = [];

    if (start) { where += ' AND o.created_at >= ?'; params.push(start); }
    if (end) { where += ' AND o.created_at <= ?'; params.push(end); }

    const sql = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.avatar AS avatar,
        SUM(oi.quantity * oi.price) AS revenue,
        SUM(oi.quantity) AS total_sold
      FROM order_items oi
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${where}
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT ?
    `;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    // convert numeric strings to numbers
    const out = rows.map(r => ({
      ...r,
      revenue: Number(r.revenue || 0),
      total_sold: Number(r.total_sold || 0)
    }));
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('topProducts error', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * GET /api/reports/revenue-by-month?months=12&start=2025-01-01&end=2025-12-31
 * trả về doanh thu theo tháng (yyyy-mm)
 */
async function revenueByMonth(req, res) {
  try {
    const start = req.query.start;
    const end = req.query.end;

    let where = "WHERE o.payment_status = 'paid' AND o.status = 'delivered'";
    const params = [];
    if (start) { where += ' AND o.created_at >= ?'; params.push(start); }
    if (end) { where += ' AND o.created_at <= ?'; params.push(end); }

    const sql = `
      SELECT
        DATE_FORMAT(o.created_at, '%Y-%m') AS month,
        SUM(oi.quantity * oi.price) AS revenue
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY month
      ORDER BY month DESC
    `;
    const [rows] = await pool.query(sql, params);
    const out = rows.map(r => ({ month: r.month, revenue: Number(r.revenue || 0) }));
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('revenueByMonth error', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * GET /api/reports/top-buyers?limit=10&start=2025-01-01&end=2025-12-31
 * trả về danh sách người mua nhiều nhất theo tổng tiền (total_spent) và số đơn
 */
async function topBuyers(req, res) {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const start = req.query.start;
    const end = req.query.end;

    let where = "WHERE o.payment_status = 'paid' AND o.status = 'delivered'";
    const params = [];
    if (start) { where += ' AND o.created_at >= ?'; params.push(start); }
    if (end) { where += ' AND o.created_at <= ?'; params.push(end); }

    const sql = `
      SELECT
        u.id AS user_id,
        u.name,
        u.email,
        COUNT(DISTINCT o.id) AS orders_count,
        SUM(oi.quantity * oi.price) AS total_spent
      FROM users u
      JOIN orders o ON o.user_id = u.id
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT ?
    `;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    const out = rows.map(r => ({
      user_id: r.user_id,
      name: r.name,
      email: r.email,
      orders_count: Number(r.orders_count || 0),
      total_spent: Number(r.total_spent || 0)
    }));
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('topBuyers error', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

/**
 * GET /api/reports/revenue-summary?start=2025-01-01&end=2025-12-31
 * trả về tổng doanh thu, số đơn hàng, số khách hàng trong khoảng thời gian
 */
async function revenueSummary(req, res) {
  try {
    const start = req.query.start;
    const end = req.query.end;

    let where = "WHERE o.payment_status = 'paid' AND o.status = 'delivered'";
    const params = [];
    if (start) { where += ' AND o.created_at >= ?'; params.push(start); }
    if (end) { where += ' AND o.created_at <= ?'; params.push(end); }

    const sql = `
      SELECT
        SUM(oi.quantity * oi.price) AS total_revenue,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT o.user_id) AS total_customers,
        SUM(oi.quantity) AS total_items
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
    `;
    
    const [rows] = await pool.query(sql, params);
    const data = rows[0] || {};
    
    res.json({ 
      success: true, 
      data: {
        total_revenue: Number(data.total_revenue || 0),
        total_orders: Number(data.total_orders || 0),
        total_customers: Number(data.total_customers || 0),
        total_items: Number(data.total_items || 0)
      }
    });
  } catch (err) {
    console.error('revenueSummary error', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

module.exports = {
  topProducts,
  revenueByMonth,
  topBuyers,
  revenueSummary
};
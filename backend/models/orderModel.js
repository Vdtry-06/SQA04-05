const { pool } = require('../config/mysql');

class OrderModel {
  static async create(orderData) {
    const { user_id, total_price, status, payment_status, shipping_address, payment_method, note } = orderData;

    const sql = `
      INSERT INTO orders 
      (user_id, total_price, status, payment_status, shipping_address, payment_method, note, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query(sql, [
      user_id,
      total_price,
      status || 'pending',
      payment_status || 'unpaid',
      shipping_address || null,
      payment_method || null,
      note || null
    ]);

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    return rows[0] || { id: result.insertId };
  }

  static async findById(orderId) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return rows[0] || null;
  }

  static async findByIdWithDetails(orderId) {
    const sql = `
      SELECT 
        o.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    const [rows] = await pool.query(sql, [orderId]);
    if (rows.length === 0) return null;
    const order = rows[0];
    const items = await this.getOrderItems(orderId);
    return {
      id: order.id,
      user_id: order.user_id,
      customer_name: order.user_name,
      customer_email: order.user_email,
      customer_phone: order.user_phone,
      total_price: parseFloat(order.total_price),
      status: order.status,
      payment_status: order.payment_status,
      shipping_address: order.shipping_address || null,
      payment_method: order.payment_method || null,
      note: order.note || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      order_items: items
    };
  }

  static async findByUserId(userId, filters = {}) {
    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      const offset = (parseInt(filters.page || 1) - 1) * parseInt(filters.limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async countByUserId(userId, filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
    const params = [userId];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0].count;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;

    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('o.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');

    sql += ' ORDER BY o.created_at DESC';

    if (filters.limit) {
      const offset = (parseInt(filters.page || 1) - 1) * parseInt(filters.limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM orders';
    const params = [];

    if (filters.status) {
      sql += ' WHERE status = ?';
      params.push(filters.status);
    }

    const [rows] = await pool.query(sql, params);
    return rows[0].count;
  }

  static async update(orderId, orderData) {
    const fields = [];
    const params = [];
    const allowedFields = ['total_price', 'status', 'payment_status', 'shipping_address', 'payment_method', 'note'];

    for (const field of allowedFields) {
      if (orderData[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(orderData[field]);
      }
    }

    if (fields.length === 0) return await this.findById(orderId);

    fields.push('updated_at = NOW()');
    params.push(orderId);

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, params);

    return await this.findById(orderId);
  }

  static async updateStatus(orderId, status) {
    await pool.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId]);
    return await this.findById(orderId);
  }

  static async updatePaymentStatus(orderId, paymentStatus) {
    await pool.query('UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?', [paymentStatus, orderId]);
    return await this.findById(orderId);
  }

  static async delete(orderId) {
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    return result.affectedRows > 0;
  }

  static async addOrderItem(orderItemData) {
    const { order_id, product_variant_id, quantity, price } = orderItemData;
    const sql = `
      INSERT INTO order_items 
      (order_id, product_variant_id, quantity, price) 
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [order_id, product_variant_id, quantity, price]);
    return { id: result.insertId, ...orderItemData };
  }

  static async getOrderItems(orderId) {
    const sql = `
      SELECT 
        oi.id,
        oi.quantity,
        oi.price,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.unit,
        p.id as product_id,
        p.name as product_name,
        p.avatar as product_avatar
      FROM order_items oi
      JOIN product_variants pv ON oi.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;
    const [rows] = await pool.query(sql, [orderId]);
    
    return rows.map(row => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name,
      product_avatar: row.product_avatar,
      variant_id: row.variant_id,
      variant_name: row.variant_name,
      unit: row.unit,
      quantity: row.quantity,
      price: parseFloat(row.price),
      subtotal: row.quantity * parseFloat(row.price)
    }));
  }

  static async countOrderItems(orderId) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?', [orderId]);
    return rows[0].count;
  }
}

module.exports = OrderModel;
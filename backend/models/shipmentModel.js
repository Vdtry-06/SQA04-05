const { pool } = require('../config/mysql');

class ShipmentModel {
  static async findByOrderId(orderId) {
    const [rows] = await pool.query(
      'SELECT * FROM shipments WHERE order_id = ?',
      [orderId]
    );
    return rows[0] || null;
  }

  static async create(shipmentData) {
    const { order_id, tracking_number, carrier, shipped_date, delivered_date } = shipmentData;

    const sql = `
      INSERT INTO shipments 
      (order_id, tracking_number, carrier, shipped_date, delivered_date) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      order_id,
      tracking_number || null,
      carrier || null,
      shipped_date || null,
      delivered_date || null
    ]);

    return await this.findByOrderId(order_id);
  }

  static async update(orderId, shipmentData) {
    const fields = [];
    const params = [];
    const allowedFields = ['tracking_number', 'carrier', 'shipped_date', 'delivered_date'];

    for (const field of allowedFields) {
      if (shipmentData[field] !== undefined && shipmentData[field] !== null) {
        fields.push(`${field} = ?`);
        params.push(shipmentData[field]);
      }
    }

    if (fields.length === 0) return await this.findByOrderId(orderId);

    params.push(orderId);

    const sql = `UPDATE shipments SET ${fields.join(', ')} WHERE order_id = ?`;
    await pool.query(sql, params);

    return await this.findByOrderId(orderId);
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT 
        s.*,
        o.id as order_id,
        o.status as order_status
      FROM shipments s
      JOIN orders o ON s.order_id = o.id
    `;

    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('s.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');

    sql += ' ORDER BY s.created_at DESC';

    if (filters.limit) {
      const offset = (parseInt(filters.page || 1) - 1) * parseInt(filters.limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), offset);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async delete(orderId) {
    const [result] = await pool.query('DELETE FROM shipments WHERE order_id = ?', [orderId]);
    return result.affectedRows > 0;
  }
}

module.exports = ShipmentModel;

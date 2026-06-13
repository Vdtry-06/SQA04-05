const { query } = require('../config/mysql');

class CartModel {
  // Lấy cart theo user_id
  static async findByUserId(userId) {
    const sql = 'SELECT * FROM carts WHERE user_id = ?';
    const rows = await query(sql, [userId]);
    return rows[0] || null;
  }

  // Lấy cart theo ID
  static async findById(cartId) {
    const sql = 'SELECT * FROM carts WHERE id = ?';
    const rows = await query(sql, [cartId]);
    return rows[0] || null;
  }

  // Tạo cart mới
  static async create(userId) {
    const sql = 'INSERT INTO carts (user_id, created_at) VALUES (?, NOW())';
    const result = await query(sql, [userId]);
    return { id: result.insertId, user_id: userId };
  }

  // Lấy cart với tất cả items và thông tin sản phẩm
  static async findByUserIdWithItems(userId) {
    const sql = `
      SELECT 
        c.id as cart_id,
        ci.id as cart_item_id,
        ci.quantity,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.unit,
        pv.price_list,
        pv.price_sale,
        pv.stock,
        p.id as product_id,
        p.name as product_name,
        p.avatar as product_avatar
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY ci.id DESC
    `;
    
    const rows = await query(sql, [userId]);
    
    if (rows.length === 0) return null;
    
    // Nếu cart tồn tại nhưng không có items
    if (!rows[0].cart_item_id) {
      return {
        cart_id: rows[0].cart_id,
        items: [],
        total_items: 0,
        total_price: 0
      };
    }
    
    // Format data
    const items = rows.map(row => ({
      cart_item_id: row.cart_item_id,
      product_id: row.product_id,
      product_name: row.product_name,
      product_avatar: row.product_avatar,
      variant_id: row.variant_id,
      variant_name: row.variant_name,
      unit: row.unit,
      price_list: parseFloat(row.price_list),
      price_sale: parseFloat(row.price_sale),
      price: parseFloat(row.price_sale), // Thêm field price để frontend dễ sử dụng
      stock: row.stock,
      quantity: row.quantity,
      subtotal: row.quantity * parseFloat(row.price_sale)
    }));
    
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    return {
      cart_id: rows[0].cart_id,
      items,
      total_items: items.length,
      total_price: totalPrice
    };
  }

  // === CART ITEMS ===

  // Lấy cart item theo ID
  static async findItemById(cartItemId) {
    const sql = 'SELECT * FROM cart_items WHERE id = ?';
    const rows = await query(sql, [cartItemId]);
    return rows[0] || null;
  }

  // Kiểm tra xem variant đã có trong cart chưa
  static async findItemByCartAndVariant(cartId, variantId) {
    const sql = 'SELECT * FROM cart_items WHERE cart_id = ? AND product_variant_id = ?';
    const rows = await query(sql, [cartId, variantId]);
    return rows[0] || null;
  }

  // Thêm item vào cart
  static async addItem(cartId, variantId, quantity) {
    const sql = 'INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES (?, ?, ?)';
    const result = await query(sql, [cartId, variantId, quantity]);
    return { id: result.insertId, cart_id: cartId, product_variant_id: variantId, quantity };
  }

  // Cập nhật quantity của cart item
  static async updateItemQuantity(cartItemId, quantity) {
    const sql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
    await query(sql, [quantity, cartItemId]);
    return await this.findItemById(cartItemId);
  }

  // Tăng quantity của cart item
  static async incrementItemQuantity(cartItemId, quantity) {
    const sql = 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?';
    await query(sql, [quantity, cartItemId]);
    return await this.findItemById(cartItemId);
  }

  // Xóa cart item
  static async removeItem(cartItemId) {
    const sql = 'DELETE FROM cart_items WHERE id = ?';
    const result = await query(sql, [cartItemId]);
    return result.affectedRows > 0;
  }

  // Xóa tất cả items trong cart
  static async clearCartItems(cartId) {
    const sql = 'DELETE FROM cart_items WHERE cart_id = ?';
    const result = await query(sql, [cartId]);
    return result.affectedRows;
  }

  // Lấy tất cả items của cart với thông tin chi tiết
  static async getCartItemsWithDetails(cartId) {
    const sql = `
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.unit,
        pv.price_list,
        pv.price_sale,
        pv.stock,
        p.id as product_id,
        p.name as product_name,
        p.avatar as product_avatar
      FROM cart_items ci
      JOIN product_variants pv ON ci.product_variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC
    `;
    
    return await query(sql, [cartId]);
  }
}

module.exports = CartModel;
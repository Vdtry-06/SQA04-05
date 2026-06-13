const { pool } = require('../config/mysql');

// Lấy tất cả sản phẩm (bao gồm inactive) - dành cho admin
async function findAllWithVariants() {
  const [rows] = await pool.query(`
    SELECT p.id, p.category_id, p.supplier_id, p.name, p.description, p.avatar, p.images, p.status, p.created_at, p.origin, p.expiry_date,
      IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
        'id', pv.id,
        'name', pv.name,
        'unit', pv.unit,
        'price_list', pv.price_list,
        'price_sale', pv.price_sale,
        'stock', pv.stock
      )), JSON_ARRAY()) AS variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return rows;
}

// Lấy tất cả sản phẩm active (trang chủ + trang sản phẩm)
async function findAllActive() {
  const [rows] = await pool.query(`
    SELECT p.id, p.category_id, p.name, p.description, p.avatar, p.images, p.status, p.created_at, p.origin, p.expiry_date,
      COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 1), 0) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
        'id', pv.id,
        'name', pv.name,
        'unit', pv.unit,
        'price_list', pv.price_list,
        'price_sale', pv.price_sale,
        'stock', pv.stock
      )), JSON_ARRAY()) AS variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return rows;
}

// Lấy sản phẩm theo category
async function findByCategory(categoryId) {
  const [rows] = await pool.query(`
    SELECT p.id, p.category_id, p.name, p.description, p.avatar, p.images, p.status, p.created_at, p.origin, p.expiry_date,
      COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 1), 0) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
        'id', pv.id,
        'name', pv.name,
        'unit', pv.unit,
        'price_list', pv.price_list,
        'price_sale', pv.price_sale,
        'stock', pv.stock
      )), JSON_ARRAY()) AS variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.category_id = ? AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [categoryId]);
  return rows;
}

// Tìm kiếm sản phẩm theo tên
async function findByName(name) {
  const [rows] = await pool.query(`
    SELECT p.id, p.category_id, p.name, p.description, p.avatar, p.images, p.status, p.created_at, p.origin, p.expiry_date,
      COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 1), 0) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
        'id', pv.id,
        'name', pv.name,
        'unit', pv.unit,
        'price_list', pv.price_list,
        'price_sale', pv.price_sale,
        'stock', pv.stock
      )), JSON_ARRAY()) AS variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.name LIKE ? AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [`%${name}%`]);
  return rows;
}

// Lấy chi tiết sản phẩm với variants
async function findByIdWithVariants(id) {
  const [rows] = await pool.query(`
    SELECT p.id, p.category_id, p.name, p.description, p.avatar, p.images, p.status, p.created_at, p.origin, p.expiry_date,
      COALESCE(ROUND((SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id), 1), 0) AS avg_rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      IFNULL(JSON_ARRAYAGG(JSON_OBJECT(
        'id', pv.id,
        'name', pv.name,
        'unit', pv.unit,
        'price_list', pv.price_list,
        'price_sale', pv.price_sale,
        'stock', pv.stock
      )), JSON_ARRAY()) AS variants
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0] || null;
}

// Lấy thông tin variant theo id
async function findVariantById(variantId) {
  const [rows] = await pool.query(`
    SELECT pv.*, p.name as product_name 
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.id = ?
  `, [variantId]);
  return rows[0] || null;
}

async function update(id, data) {
  const fields = [];
  const values = [];
  if (data.name) { fields.push('name = ?'); values.push(data.name); }
  if (data.description) { fields.push('description = ?'); values.push(data.description); }
  if (data.status) { fields.push('status = ?'); values.push(data.status); }
  if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
  if (fields.length === 0) return { affectedRows: 0 };
  values.push(id);
  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  const [res] = await pool.query(sql, values);
  return res;
}

// Replace remove to delete variants first in a transaction
async function removeWithVariants(productId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    const [res] = await conn.query('DELETE FROM products WHERE id = ?', [productId]);
    await conn.commit();
    return res;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Cập nhật tồn kho của variant
async function updateVariantStock(variantId, quantity, operation = 'decrement') {
  try {
    let sql;
    if (operation === 'increment') {
      sql = 'UPDATE product_variants SET stock = stock + ? WHERE id = ?';
    } else {
      sql = 'UPDATE product_variants SET stock = stock - ? WHERE id = ?';
    }
    
    const [result] = await pool.query(sql, [quantity, variantId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating variant stock:', error);
    return false;
  }
}
// Replace or add transactional update that upsert/delete variants
async function updateWithVariants(productId, data = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const imagesJson = data.images ? JSON.stringify(data.images) : null;
    const sqlUpdate = `
      UPDATE products
      SET category_id = ?, supplier_id = ?, name = ?, description = ?, avatar = ?, images = ?, origin = ?, expiry_date = ?, status = ?
      WHERE id = ?
    `;
    await conn.query(sqlUpdate, [
      data.category_id || null,
      data.supplier_id,
      data.name || null,
      data.description || null,
      data.avatar || null,
      imagesJson,
      data.origin || null,
      data.expiry_date || null,
      data.status || null,
      productId
    ]);
    if (Array.isArray(data.variants)) {
      for (const v of data.variants) {
        // delete flagged variant
        if (v._delete && v.id) {
          await conn.query('DELETE FROM product_variants WHERE id = ? AND product_id = ?', [v.id, productId]);
          continue;
        }
        // update existing
        if (v.id) {
          await conn.query(
            `UPDATE product_variants SET name = ?, unit = ?, price_list = ?, price_sale = ?, stock = ? WHERE id = ? AND product_id = ?`,
            [v.name || null, v.unit || null, v.price_list ?? 0, v.price_sale ?? 0, v.stock ?? 0, v.id, productId]
          );
        } else {
          // insert new variant
          await conn.query(
            `INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES (?, ?, ?, ?, ?, ?)`,
            [productId, v.name || null, v.unit || null, v.price_list ?? 0, v.price_sale ?? 0, v.stock ?? 0]
          );
        }
      }
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function deleteVariantById(variantId) {
  const [result] = await pool.query('DELETE FROM product_variants WHERE id = ?', [variantId]);
  return result;
}
// Tạo mới product + variants trong 1 transaction
async function createWithVariants(data = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const imagesJson = data.images ? JSON.stringify(data.images) : null;
    const sqlInsert = `
      INSERT INTO products (category_id, supplier_id, name, description, avatar, images, origin, expiry_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [res] = await conn.query(sqlInsert, [
      data.category_id || null,
      data.supplier_id || null,
      data.name || null,
      data.description || null,
      data.avatar || null,
      imagesJson,
      data.origin || null,
      data.expiry_date || null,
      data.status || null
    ]);

    const productId = res.insertId;

    if (Array.isArray(data.variants)) {
      for (const v of data.variants) {
        await conn.query(
          `INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES (?, ?, ?, ?, ?, ?)`,
          [productId, v.name || null, v.unit || null, v.price_list ?? 0, v.price_sale ?? 0, v.stock ?? 0]
        );
      }
    }

    await conn.commit();
    return { success: true, id: productId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
module.exports = {
  findAllWithVariants,
  findAllActive,
  findByCategory,
  findByName,
  findByIdWithVariants,
  findById,
  findVariantById,
  update,
  removeWithVariants,
  updateVariantStock,
  updateWithVariants,
  deleteVariantById,
  createWithVariants
};
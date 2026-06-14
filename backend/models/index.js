const { pool } = require('../config/mysql');

const blogModel = require('./blogModel');
const cartModel = require('./cartModel');
const categoryModel = require('./categoryModel');
const orderModel = require('./orderModel');
const productModel = require('./productModel');
const userModel = require('./userModel');

/**
 * Test kết nối DB (sử dụng khi khởi động server)
 */
async function testConnection() {
  try {
    // simple query to validate connection
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    throw new Error('Database connection failed: ' + (err.message || err));
  }
}

module.exports = {
  blogModel,
  cartModel,
  categoryModel,
  orderModel,
  productModel,
  userModel,
  testConnection
};
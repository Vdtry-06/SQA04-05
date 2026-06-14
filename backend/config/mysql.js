const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,     // Giữ kết nối sống
  keepAliveInitialDelay: 0,
  timezone: '+07:00'         // Múi giờ Việt Nam
});

// Helper function để execute query
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };

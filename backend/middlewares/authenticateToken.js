const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && typeof authHeader === 'string' && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded contains payload { id }
    req.userId = decoded && decoded.id ? decoded.id : null;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = authenticateToken;
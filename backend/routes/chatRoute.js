const express = require('express');
const router = express.Router();
const { chatHandler, chatRateLimiter } = require('../controllers/chatController');

router.post('/', chatRateLimiter, chatHandler);

module.exports = router;
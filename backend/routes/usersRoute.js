const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

// GET /api/v1/admin/users/getAllUsers
router.get('/getAllUsers', userCtrl.getAllUsers);
// GET /api/v1/admin/users/:userId
router.get('/:userId', userCtrl.getUser);
router.post('/search', userCtrl.searchUsers);
router.post('/createUser', userCtrl.createUser);// PUT /api/users/:userId
router.put('/:userId', userCtrl.updateUser);
// PUT /api/users/:userId/change-password
router.put('/:userId/change-password', userCtrl.changePassword);

module.exports = router;

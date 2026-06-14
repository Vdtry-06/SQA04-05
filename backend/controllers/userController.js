const userService = require('../services/userService');
const authService = require('../services/authService');

async function getAllUsers(req, res, next) {
  try {
    const rows = await userService.getAllUsers();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

// Tìm kiếm người dùng theo ID, email hoặc tên
async function searchUsers(req, res, next) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const users = await userService.getAllUsers();
    const results = users.filter(u => {
      const queryLower = query.toLowerCase();
      return (
        (u.id && u.id.toString().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(queryLower)) ||
        (u.name && u.name.toLowerCase().includes(queryLower)) ||
        (u.phone && u.phone.includes(query))
      );
    });

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
}

// Tạo người dùng mới (admin)
async function createUser(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required' });
    }

    const user = await authService.createUser({ name, email, phone, password });
    res.json({ success: true, message: 'User created successfully', data: user });
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, phone } = req.body;
    const userId = req.params.userId;
    
    const updatedUser = await userService.updateUser(userId, { name, phone });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: updatedUser, message: 'User updated successfully' });
  } catch (err) { 
    next(err); 
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    const updatedUser = await userService.changePassword(userId, currentPassword, newPassword);
    
    res.json({ 
      success: true, 
      data: updatedUser, 
      message: 'Password changed successfully' 
    });
  } catch (err) {
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (err.code === 'INCORRECT_PASSWORD') {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUser,
  searchUsers,
  createUser,
  updateUser,
  changePassword
};

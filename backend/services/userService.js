const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

async function getAllUsers() {
  const rows = await userModel.findAll();
  return rows;
}

async function getUserById(id) {
  return await userModel.findById(id);
}

async function updateUser(id, data) {
  return await userModel.updateById(id, data);
}

async function changePassword(id, currentPassword, newPassword) {
  // Lấy user với password
  const user = await userModel.findByIdWithPassword(id);
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // Kiểm tra mật khẩu hiện tại
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.code = 'INCORRECT_PASSWORD';
    throw err;
  }

  // Hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  // Cập nhật mật khẩu
  return await userModel.updatePassword(id, hashedPassword);
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  changePassword
};
const authService = require('../services/authService');
const { sendPasswordResetEmail } = require('../config/nodemailer');

function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }

  return { isValid: true, message: 'Password is strong' };
}

async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password required' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    const user = await authService.createUser({ name, email, phone, password });
    const token = authService.signToken({ id: user.id });
    // chỉ trả token
    return res.status(201).json({ success: true, token });
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') return res.status(409).json({ success: false, message: err.message });
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password required' });

    const user = await authService.verifyPassword(email, password);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = authService.signToken({ id: user.id });
    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out' });
}

/**
 * GET /api/auth/me
 * Trả về thông tin minimal và role(s) dựa trên userId được gắn bởi authenticateToken
 */
async function me(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await authService.findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const roles = await authService.getRolesByUserId(userId);
    // trả role đầu tiên (hoặc trả mảng nếu cần)
    const role = roles && roles.length ? roles[0] : 'customer';
    return res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, role, roles } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * POST /api/auth/forgot-password
 * Nhận email, tạo token và gửi email reset password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { token, email: userEmail } = await authService.createResetToken(email);
    await sendPasswordResetEmail(userEmail, token);

    return res.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    });
  } catch (err) {
    if (err.code === 'USER_NOT_FOUND') {
      // Vẫn trả success để không lộ thông tin user có tồn tại hay không
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * POST /api/auth/reset-password
 * Nhận token và password mới, cập nhật password
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    await authService.updatePassword(token, password);

    return res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword
};
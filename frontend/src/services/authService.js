const API_URL = 'http://localhost:5000/api/auth';

export const authService = {
  async forgotPassword(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to send reset email');
    }
    
    return data;
  },

  async resetPassword(token, password) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    return data;
  }
};

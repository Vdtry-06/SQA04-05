const contactService = require('../services/contactService');

const contactController = {
  sendRequest: async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin: Tên, Email, Nội dung'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }

      const result = await contactService.createRequest({
        name,
        email,
        phone,
        message
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error sending contact request:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi gửi liên hệ'
      });
    }
  },

  getAllRequests: async (req, res) => {
    try {
      const result = await contactService.getAllRequests();
      res.json(result);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi lấy danh sách'
      });
    }
  },

  getRequestById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await contactService.getRequestById(id);
      res.json(result);
    } catch (error) {
      console.error('Error fetching contact request:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi lấy chi tiết'
      });
    }
  },

  deleteRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await contactService.deleteRequest(id);
      res.json(result);
    } catch (error) {
      console.error('Error deleting contact request:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi xóa liên hệ'
      });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status là bắt buộc'
        });
      }

      const result = await contactService.updateStatus(id, status);
      res.json(result);
    } catch (error) {
      console.error('Error updating contact status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật status'
      });
    }
  }
};

module.exports = contactController;

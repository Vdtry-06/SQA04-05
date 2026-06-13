const contactModel = require('../models/contactModel');

const contactService = {
  createRequest: async (data) => {
    try {
      const result = await contactModel.create(data);
      return {
        success: true,
        message: 'Gửi liên hệ thành công. Cảm ơn bạn!',
        data: { id: result.insertId }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi gửi liên hệ',
        error: error.message
      };
    }
  },

  getAllRequests: async () => {
    try {
      const results = await contactModel.getAll();
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi lấy danh sách',
        error: error.message
      };
    }
  },

  getRequestById: async (id) => {
    try {
      const results = await contactModel.getById(id);
      if (!results || results.length === 0) {
        return {
          success: false,
          message: 'Không tìm thấy'
        };
      }
      return {
        success: true,
        data: results[0]
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi lấy chi tiết',
        error: error.message
      };
    }
  },

  deleteRequest: async (id) => {
    try {
      const result = await contactModel.delete(id);
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Không tìm thấy'
        };
      }
      return {
        success: true,
        message: 'Xóa thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi xóa',
        error: error.message
      };
    }
  },

  updateStatus: async (id, status) => {
    try {
      if (!['pending', 'resolved'].includes(status)) {
        return {
          success: false,
          message: 'Status không hợp lệ'
        };
      }
      const result = await contactModel.updateStatus(id, status);
      if (result.affectedRows === 0) {
        return {
          success: false,
          message: 'Không tìm thấy'
        };
      }
      return {
        success: true,
        message: 'Cập nhật thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi cập nhật',
        error: error.message
      };
    }
  }
};

module.exports = contactService;

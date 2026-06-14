const ShipmentService = require('../services/shipmentService');

class ShipmentController {
  static async getShipment(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
      }

      const shipment = await ShipmentService.getShipment(orderId);

      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      res.json({
        success: true,
        message: 'Shipment retrieved successfully',
        data: shipment
      });
    } catch (err) {
      console.error('ShipmentController.getShipment error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin vận đơn',
        error: err.message
      });
    }
  }

  static async updateShipment(req, res) {
    try {
      const { orderId } = req.params;
      const { tracking_number, carrier, shipped_date, delivered_date } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
      }

      // Validation - Khi chuyển sang shipping phải có tracking_number, carrier, shipped_date
      if (!tracking_number || !carrier || !shipped_date) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ: Mã vận đơn, Nhà vận chuyển, Ngày gửi hàng'
        });
      }

      const shipmentData = {};
      if (tracking_number !== undefined) shipmentData.tracking_number = tracking_number;
      if (carrier !== undefined) shipmentData.carrier = carrier;
      if (shipped_date !== undefined) shipmentData.shipped_date = shipped_date;
      if (delivered_date !== undefined) shipmentData.delivered_date = delivered_date;

      const shipment = await ShipmentService.updateShipment(orderId, shipmentData);

      res.json({
        success: true,
        message: 'Cập nhật thông tin vận đơn thành công',
        data: shipment
      });
    } catch (err) {
      console.error('ShipmentController.updateShipment error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin vận đơn',
        error: err.message
      });
    }
  }

  static async getAllShipments(req, res) {
    try {
      const filters = {
        status: req.query.status || null,
        page: req.query.page || 1,
        limit: req.query.limit || 10
      };

      const shipments = await ShipmentService.getAllShipments(filters);

      res.json({
        success: true,
        message: 'Lấy danh sách vận đơn thành công',
        data: shipments
      });
    } catch (err) {
      console.error('ShipmentController.getAllShipments error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách vận đơn',
        error: err.message
      });
    }
  }

  static async deleteShipment(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required' });
      }

      const deleted = await ShipmentService.deleteShipment(orderId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      res.json({
        success: true,
        message: 'Xoá vận đơn thành công'
      });
    } catch (err) {
      console.error('ShipmentController.deleteShipment error:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xoá vận đơn',
        error: err.message
      });
    }
  }
}

module.exports = ShipmentController;

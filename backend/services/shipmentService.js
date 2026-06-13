const ShipmentModel = require('../models/shipmentModel');

class ShipmentService {
  static async getShipment(orderId) {
    try {
      const shipment = await ShipmentModel.findByOrderId(orderId);
      return shipment;
    } catch (err) {
      console.error('ShipmentService.getShipment error:', err);
      throw err;
    }
  }

  static async updateShipment(orderId, shipmentData) {
    try {
      // Check if shipment exists
      let shipment = await ShipmentModel.findByOrderId(orderId);

      if (!shipment) {
        // Create new shipment
        shipment = await ShipmentModel.create({
          order_id: orderId,
          ...shipmentData
        });
      } else {
        // Update existing shipment
        shipment = await ShipmentModel.update(orderId, shipmentData);
      }

      return shipment;
    } catch (err) {
      console.error('ShipmentService.updateShipment error:', err);
      throw err;
    }
  }

  static async getAllShipments(filters = {}) {
    try {
      return await ShipmentModel.findAll(filters);
    } catch (err) {
      console.error('ShipmentService.getAllShipments error:', err);
      throw err;
    }
  }

  static async deleteShipment(orderId) {
    try {
      return await ShipmentModel.delete(orderId);
    } catch (err) {
      console.error('ShipmentService.deleteShipment error:', err);
      throw err;
    }
  }
}

module.exports = ShipmentService;

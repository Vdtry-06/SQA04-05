const express = require('express');
const ShipmentController = require('../controllers/shipmentController');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

// Get all shipments (admin) - must come before /:orderId
router.get('/', authenticateToken, ShipmentController.getAllShipments);

// Get shipment by order ID
router.get('/:orderId', authenticateToken, ShipmentController.getShipment);

// Update or create shipment
router.put('/:orderId', authenticateToken, ShipmentController.updateShipment);

// Delete shipment
router.delete('/:orderId', authenticateToken, ShipmentController.deleteShipment);

module.exports = router;

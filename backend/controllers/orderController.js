const OrderService = require("../services/orderService");

class OrderController {
  static async getCheckoutInfo(req, res, next) {
    try {
      const { cartId } = req.params;
      const checkoutInfo = await OrderService.getCheckoutInfo(cartId);
      res.status(200).json({ success: true, data: checkoutInfo });
    } catch (error) {
      console.error("Get checkout info error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to get checkout info",
        });
    }
  }

  static async createOrder(req, res, next) {
    try {
      const { userId, cartId, shippingAddress, paymentMethod, note } = req.body;
      console.log(
        `${userId} - ${cartId} - ${shippingAddress} - ${paymentMethod} -${note}`,
      );
      if (!userId || !cartId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Missing required fields: userId, cartId",
          });
      }
      const order = await OrderService.createOrder({
        userId,
        cartId,
        shippingAddress,
        paymentMethod,
        note,
      });
      res
        .status(201)
        .json({
          success: true,
          message: "Order created successfully",
          data: order,
        });
    } catch (error) {
      console.error("Create order error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to create order",
        });
    }
  }

  static async getOrderDetail(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await OrderService.getOrderDetail(orderId);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error("Get order detail error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to get order detail",
        });
    }
  }

  static async getMyOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;
      const result = await OrderService.getMyOrders(userId, {
        status,
        page: Number(page),
        limit: Number(limit),
      });
      res
        .status(200)
        .json({
          success: true,
          data: result.orders,
          pagination: result.pagination,
        });
    } catch (error) {
      console.error("Get my orders error:", error);
      res.status(500).json({ success: false, message: "Failed to get orders" });
    }
  }

  static async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      await OrderService.cancelOrder(orderId, reason);
      res
        .status(200)
        .json({ success: true, message: "Order canceled successfully" });
    } catch (error) {
      console.error("Cancel order error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to cancel order",
        });
    }
  }

  static async updatePaymentStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { paymentStatus } = req.body;
      const validStatuses = ["paid", "unpaid", "refunded"];
      if (!validStatuses.includes(paymentStatus)) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid payment status. Must be: paid, unpaid, or refunded",
          });
      }
      await OrderService.updatePaymentStatus(orderId, paymentStatus);
      res
        .status(200)
        .json({
          success: true,
          message: "Payment status updated successfully",
        });
    } catch (error) {
      console.error("Update payment status error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to update payment status",
        });
    }
  }

  static async getAllOrders(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await OrderService.getAllOrders({
        status,
        page: Number(page),
        limit: Number(limit),
      });
      res
        .status(200)
        .json({
          success: true,
          data: result.orders,
          pagination: result.pagination,
        });
    } catch (error) {
      console.error("Get all orders error:", error);
      res.status(500).json({ success: false, message: "Failed to get orders" });
    }
  }

  static async updateOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status, payment_status } = req.body;

      if (status) {
        const validStatuses = [
          "pending",
          "confirmed",
          "shipping",
          "delivered",
          "canceled",
        ];
        if (!validStatuses.includes(status)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid status" });
        }
      }

      if (payment_status) {
        const validPaymentStatuses = ["paid", "unpaid", "refunded"];
        if (!validPaymentStatuses.includes(payment_status)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid payment status" });
        }
      }

      await OrderService.updateOrder(orderId, { status, payment_status });
      res
        .status(200)
        .json({ success: true, message: "Order updated successfully" });
    } catch (error) {
      console.error("Update order error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to update order",
        });
    }
  }

  static async searchOrders(req, res, next) {
    try {
      const { query } = req.body;
      if (!query) {
        return res
          .status(400)
          .json({ success: false, message: "Query is required" });
      }

      // Tìm theo ID hoặc tên khách hàng
      let result;
      if (/^\d+$/.test(query)) {
        // Tìm theo order ID
        const order = await OrderService.getOrderDetail(query);
        result = order ? [order] : [];
      } else {
        // Tìm theo tên khách hàng (sử dụng findAll với filter)
        const orders = await OrderService.getAllOrders({ page: 1, limit: 100 });
        result = (orders.orders || []).filter(
          (o) =>
            o.customer_name &&
            o.customer_name.toLowerCase().includes(query.toLowerCase()),
        );
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Search orders error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to search orders" });
    }
  }
}

module.exports = OrderController;

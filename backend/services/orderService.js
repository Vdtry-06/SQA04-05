const { cartModel, orderModel, productModel, userModel } = require('../models');
const { pool } = require('../config/mysql');
const { update } = require('../models/orderModel');

class OrderService {
  // Xem thông tin checkout
  static async getCheckoutInfo(cartId) {
    try {
      const cart = await cartModel.findById(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Lấy cart items với details
      const items = await cartModel.getCartItemsWithDetails(cartId);

      if (!items || items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Format items
      const formattedItems = items.map(item => ({
        cart_item_id: item.cart_item_id,
        product_name: item.product_name,
        product_avatar: item.product_avatar,
        variant_name: item.variant_name,
        unit: item.unit,
        price_sale: parseFloat(item.price_sale),
        price: parseFloat(item.price_sale), // Alias để frontend dễ sử dụng
        stock: item.stock,
        quantity: item.quantity,
        subtotal: item.quantity * parseFloat(item.price_sale)
      }));

      const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingFee = 30000; // Phí ship cố định
      const tax = subtotal * 0.1; // VAT 10%
      const totalPrice = subtotal + shippingFee + tax;

      return {
        items: formattedItems,
        subtotal,
        shipping_fee: shippingFee,
        tax,
        total_price: totalPrice
      };
    } catch (error) {
      throw error;
    }
  }

  // Tạo đơn hàng
  static async createOrder(orderData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { userId, cartId, shippingAddress, paymentMethod, note } = orderData;

      // Lấy cart items với details
      const cartItems = await cartModel.getCartItemsWithDetails(cartId);

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Kiểm tra tồn kho
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          throw new Error(`Insufficient stock for product variant ${item.variant_name}`);
        }
      }

      // Tính tổng tiền
      const subtotal = cartItems.reduce((sum, item) => 
        sum + (item.quantity * parseFloat(item.price_sale)), 0
      );
      const shippingFee = 30000;
      const tax = subtotal * 0.1;
      const totalPrice = subtotal + shippingFee + tax;

      // Tạo đơn hàng
      const order = await orderModel.create({
        user_id: userId,
        total_price: totalPrice,
        status: 'pending',
        payment_status: 'unpaid',
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        note: note
      });

      // Thêm order items và giảm tồn kho
      for (const item of cartItems) {
        // Thêm order item
        await orderModel.addOrderItem({
          order_id: order.id,
          product_variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price_sale
        });

        // Giảm tồn kho
        const updated = await productModel.updateVariantStock(item.variant_id, item.quantity, 'decrement');
        if (!updated) {
          throw new Error(`Failed to update stock for variant ${item.variant_name}`);
        }
      }

      // Xóa giỏ hàng
      await cartModel.clearCartItems(cartId);

      await connection.commit();

      return { 
        order_id: order.id, 
        total_price: totalPrice 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Lấy chi tiết đơn hàng
  static async getOrderDetail(orderId) {
    try {
      const order = await orderModel.findByIdWithDetails(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử đơn hàng
  static async getMyOrders(userId, filters = {}) {
    try {
      const orders = await orderModel.findByUserId(userId, filters);
      const count = await orderModel.countByUserId(userId, filters);

      // Lấy số items cho mỗi order
      const formattedOrders = await Promise.all(
        orders.map(async (order) => {
          const itemCount = await orderModel.countOrderItems(order.id);
          return {
            id: order.id,
            total_price: parseFloat(order.total_price),
            status: order.status,
            payment_status: order.payment_status,
            created_at: order.created_at,
            total_items: itemCount
          };
        })
      );

      return {
        orders: formattedOrders,
        pagination: {
          page: parseInt(filters.page || 1),
          limit: parseInt(filters.limit || 10),
          total: count,
          total_pages: Math.ceil(count / parseInt(filters.limit || 10))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Hủy đơn hàng
  static async cancelOrder(orderId, reason) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const order = await orderModel.findById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'delivered' || order.status === 'canceled') {
        throw new Error('Cannot cancel this order');
      }

      // Lấy order items
      const items = await orderModel.getOrderItems(orderId);

      // Hoàn lại tồn kho
      for (const item of items) {
        await productModel.updateVariantStock(item.variant_id, item.quantity, 'increment');
      }

      // Cập nhật trạng thái đơn hàng
      const updateData = { status: 'canceled' };
      if (order.payment_status === 'paid') {
        updateData.payment_status = 'refunded';
      }
      await orderModel.update(orderId, updateData);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Cập nhật trạng thái thanh toán
  static async updatePaymentStatus(orderId, paymentStatus) {
    try {
      await orderModel.updatePaymentStatus(orderId, paymentStatus);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // [ADMIN] Lấy tất cả đơn hàng
  static async getAllOrders(filters = {}) {
    try {
      const orders = await orderModel.findAll(filters);
      const count = await orderModel.count(filters);

      // Lấy số items cho mỗi order
      const formattedOrders = await Promise.all(
        orders.map(async (order) => {
          const itemCount = await orderModel.countOrderItems(order.id);
          return {
            id: order.id,
            customer_name: order.user_name,
            customer_email: order.user_email,
            total_price: parseFloat(order.total_price),
            shipping_address: order.shipping_address,
            status: order.status,
            payment_status: order.payment_status,
            created_at: order.created_at,
            updated_at: order.updated_at,
            total_items: itemCount
          };
        })
      );

      return {
        orders: formattedOrders,
        pagination: {
          page: parseInt(filters.page || 1),
          limit: parseInt(filters.limit || 20),
          total: count,
          total_pages: Math.ceil(count / parseInt(filters.limit || 20))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // [ADMIN] Cập nhật đơn hàng
  static async updateOrder(orderId, updateData) {
    try {
      await orderModel.update(orderId, updateData);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderService;
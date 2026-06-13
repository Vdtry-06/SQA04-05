const { cartModel, productModel } = require('../models/index');
const { orderModel } = require('../models');

class CartService {
  // Lấy hoặc tạo giỏ hàng cho user
  static async getOrCreateCart(userId) {
    try {
      let cart = await cartModel.findByUserId(userId);

      if (!cart) {
        cart = await cartModel.create(userId);
      }
      
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  static async addItem(userId, productVariantId, quantity) {
    try {
      // Kiểm tra variant có tồn tại và còn hàng không
      console.log('🔍 Checking variant:', productVariantId);
      const variant = await productModel.findVariantById(productVariantId);
      console.log('📦 Variant found:', variant);
      
      // Debug: check database connection
      const pool = require('../config/mysql').pool;
      const [dbInfo] = await pool.query('SELECT DATABASE() as db_name');
      console.log('🗄️  Current database:', dbInfo[0].db_name);
      
      if (!variant) {
        throw new Error('Product variant not found');
      }

      if (variant.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${variant.stock}`);
      }

      // Lấy hoặc tạo giỏ hàng
      const cart = await this.getOrCreateCart(userId);

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      const existingItem = await cartModel.findItemByCartAndVariant(cart.id, productVariantId);

      if (existingItem) {
        // Cập nhật số lượng
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > variant.stock) {
          throw new Error(`Insufficient stock. Available: ${variant.stock}`);
        }
        await cartModel.updateItemQuantity(existingItem.id, newQuantity);
      } else {
        // Thêm mới
        await cartModel.addItem(cart.id, productVariantId, quantity);
      }

      return { cart_id: cart.id };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin giỏ hàng
  static async getCartByUserId(userId) {
    try {
      const cart = await cartModel.findByUserIdWithItems(userId);
      return cart;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật số lượng sản phẩm
  static async updateItem(cartItemId, quantity) {
    try {
      const cartItem = await cartModel.findItemById(cartItemId);

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Lấy thông tin variant để check stock
      const variant = await productModel.findVariantById(cartItem.product_variant_id);

      if (!variant || variant.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${variant ? variant.stock : 0}`);
      }

      await cartModel.updateItemQuantity(cartItemId, quantity);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  static async removeItem(cartItemId) {
    try {
      const cartItem = await cartModel.findItemById(cartItemId);
      
      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      await cartModel.removeItem(cartItemId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Xóa toàn bộ giỏ hàng
  static async clearCart(cartId) {
    try {
      await cartModel.clearCartItems(cartId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Khôi phục giỏ hàng từ đơn hàng VNPay chưa thanh toán
  static async restoreCartFromOrder(userId, orderId) {
    try {
      // Lấy đơn hàng
      const order = await orderModel.findByIdWithDetails(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Kiểm tra đơn hàng có thuộc user này không
      if (order.user_id !== parseInt(userId)) {
        throw new Error('Order does not belong to this user');
      }

      // Kiểm tra đơn hàng phải là VNPay và chưa thanh toán hoặc đã bị hủy
      if (order.payment_method !== 'VNPAY' || order.payment_status !== 'unpaid') {
        throw new Error('Only unpaid VNPay orders can be restored');
      }

      // Cho phép restore từ đơn hàng có status 'pending', 'cancelled' hoặc các status khác (miễn là payment_status = unpaid)
      // Status được kiểm tra qua payment_status ở trên

      // Lấy hoặc tạo giỏ hàng mới
      const cart = await this.getOrCreateCart(userId);

      // Thêm các item từ đơn hàng vào giỏ hàng
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          // Kiểm tra variant còn hàng
          const variant = await productModel.findVariantById(item.variant_id);
          
          if (!variant) {
            throw new Error(`Product variant ${item.variant_name} not found`);
          }

          if (variant.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product_name}. Available: ${variant.stock}, Requested: ${item.quantity}`);
          }

          // Thêm vào giỏ hàng
          const existingItem = await cartModel.findItemByCartAndVariant(cart.id, item.variant_id);

          if (existingItem) {
            // Cập nhật số lượng
            await cartModel.updateItemQuantity(existingItem.id, existingItem.quantity + item.quantity);
          } else {
            // Thêm item mới
            await cartModel.addItem(cart.id, item.variant_id, item.quantity);
          }
        }
      }

      return {
        cart_id: cart.id,
        restored_items: order.order_items ? order.order_items.length : 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CartService;
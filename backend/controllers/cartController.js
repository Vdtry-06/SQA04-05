const CartService = require("../services/cartService");

class CartController {
  // Thêm sản phẩm vào giỏ hàng
  static async addItem(req, res, next) {
    try {
      const { userId, productVariantId, quantity } = req.body;
      if (!userId || !productVariantId || !quantity) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: userId, productVariantId, quantity",
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
      }

      // Gọi service xử lý logic
      const result = await CartService.addItem(
        userId,
        productVariantId,
        quantity,
      );

      res.status(200).json({
        success: true,
        message: "Product added to cart successfully",
        data: result,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add product to cart",
      });
    }
  }

  // Xem giỏ hàng
  static async viewCart(req, res, next) {
    try {
      const { userId } = req.params;

      // Gọi service để lấy hoặc tạo cart
      let cart = await CartService.getCartByUserId(userId);

      // Nếu chưa có cart, tạo cart mới và trả về cart rỗng
      if (!cart) {
        await CartService.getOrCreateCart(userId);
        cart = {
          cart_id: null,
          items: [],
          total_items: 0,
          total_price: 0,
        };
      }

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("View cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get cart",
      });
    }
  }

  // Cập nhật số lượng
  static async updateItem(req, res, next) {
    try {
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      // Gọi service
      await CartService.updateItem(cartItemId, quantity);

      res.status(200).json({
        success: true,
        message: "Cart item updated successfully",
      });
    } catch (error) {
      console.error("Update cart item error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update cart item",
      });
    }
  }

  // Xóa sản phẩm
  static async removeItem(req, res, next) {
    try {
      const { cartItemId } = req.params;

      // Gọi service
      await CartService.removeItem(cartItemId);

      res.status(200).json({
        success: true,
        message: "Cart item removed successfully",
      });
    } catch (error) {
      console.error("Remove cart item error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to remove cart item",
      });
    }
  }

  // Xóa toàn bộ giỏ hàng
  static async clearCart(req, res, next) {
    try {
      const { cartId } = req.params;

      // Gọi service
      await CartService.clearCart(cartId);

      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear cart",
      });
    }
  }

  // Khôi phục giỏ hàng từ đơn hàng VNPay chưa thanh toán
  static async restoreCartFromUnpaidOrder(req, res, next) {
    try {
      const { userId, orderId } = req.body;

      if (!userId || !orderId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, orderId",
        });
      }

      const result = await CartService.restoreCartFromOrder(userId, orderId);

      res.status(200).json({
        success: true,
        message: "Cart restored successfully",
        data: result,
      });
    } catch (error) {
      console.error("Restore cart from order error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to restore cart",
      });
    }
  }
}

module.exports = CartController;

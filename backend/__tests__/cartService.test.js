/**
 * Unit Test: cartService.js
 * Người thực hiện: Cường
 * Chức năng: Cart Service - Quản lý giỏ hàng
 */

const mockCartModel = {
  findByUserId: jest.fn(),
  create: jest.fn(),
  findItemByCartAndVariant: jest.fn(),
  updateItemQuantity: jest.fn(),
  addItem: jest.fn(),
  findByUserIdWithItems: jest.fn(),
  findItemById: jest.fn(),
  removeItem: jest.fn(),
  clearCartItems: jest.fn(),
};

const mockProductModel = {
  findVariantById: jest.fn(),
};

const mockOrderModel = {
  findByIdWithDetails: jest.fn(),
};

// Mock cả '../models/index' và '../models' trỏ cùng 1 object
jest.mock('../models/index', () => ({
  cartModel: mockCartModel,
  productModel: mockProductModel,
  orderModel: mockOrderModel,
}));

jest.mock('../models', () => ({
  cartModel: mockCartModel,
  productModel: mockProductModel,
  orderModel: mockOrderModel,
}));

// Mock pool.query dùng trong addItem (debug log)
jest.mock('../config/mysql', () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ db_name: 'ecommerce_db' }]]),
  },
}));

const CartService = require('../services/cartService');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================
  // getOrCreateCart
  // ==========================================================
  describe('getOrCreateCart()', () => {
    test('TC_CART_01: Giỏ đã tồn tại → trả về giỏ cũ, không gọi create', async () => {
      const existingCart = { id: 10, user_id: 1 };
      mockCartModel.findByUserId.mockResolvedValue(existingCart);

      const result = await CartService.getOrCreateCart(1);

      expect(result).toEqual(existingCart);
      expect(mockCartModel.findByUserId).toHaveBeenCalledWith(1);
      expect(mockCartModel.create).not.toHaveBeenCalled();
    });

    test('TC_CART_02: Chưa có giỏ → tạo giỏ mới và trả về', async () => {
      mockCartModel.findByUserId.mockResolvedValue(null);
      mockCartModel.create.mockResolvedValue({ id: 20, user_id: 2 });

      const result = await CartService.getOrCreateCart(2);

      expect(result).toEqual({ id: 20, user_id: 2 });
      expect(mockCartModel.create).toHaveBeenCalledWith(2);
    });

    test('TC_CART_03: DB lỗi → throw error', async () => {
      mockCartModel.findByUserId.mockRejectedValue(new Error('DB connection failed'));

      await expect(CartService.getOrCreateCart(1)).rejects.toThrow('DB connection failed');
    });
  });

  // ==========================================================
  // addItem
  // ==========================================================
  describe('addItem()', () => {
    test('TC_CART_04: Thêm mới item vào giỏ khi variant chưa có trong giỏ', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 20 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      const result = await CartService.addItem(1, 5, 2);

      expect(result).toEqual({ cart_id: 1 });
      expect(mockCartModel.addItem).toHaveBeenCalledWith(1, 5, 2);
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });

    test('TC_CART_05: Cộng dồn số lượng khi variant đã có trong giỏ', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 20 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 100, quantity: 3 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.addItem(1, 5, 2);

      expect(result).toEqual({ cart_id: 1 });
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(100, 5); // 3 + 2
      expect(mockCartModel.addItem).not.toHaveBeenCalled();
    });

    test('TC_CART_06: Throw lỗi khi variant không tồn tại', async () => {
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.addItem(1, 999, 1)).rejects.toThrow('Product variant not found');
    });

    test('TC_CART_07: Throw lỗi khi tồn kho không đủ (thêm mới)', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 3 });

      await expect(CartService.addItem(1, 5, 10)).rejects.toThrow('Insufficient stock. Available: 3');
    });

    test('TC_CART_08: Throw lỗi khi cộng dồn vượt tồn kho', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 5 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 100, quantity: 4 });

      await expect(CartService.addItem(1, 5, 3)).rejects.toThrow('Insufficient stock. Available: 5');
    });

    test('TC_CART_09: Tạo giỏ mới nếu user chưa có giỏ khi addItem', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue(null);
      mockCartModel.create.mockResolvedValue({ id: 99 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      const result = await CartService.addItem(1, 5, 1);

      expect(result).toEqual({ cart_id: 99 });
      expect(mockCartModel.create).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================
  // getCartByUserId
  // ==========================================================
  describe('getCartByUserId()', () => {
    test('TC_CART_10: Lấy giỏ hàng có items thành công', async () => {
      const cartData = {
        id: 1, user_id: 1,
        items: [{ id: 1, product_variant_id: 5, quantity: 2 }],
      };
      mockCartModel.findByUserIdWithItems.mockResolvedValue(cartData);

      const result = await CartService.getCartByUserId(1);

      expect(result).toEqual(cartData);
      expect(mockCartModel.findByUserIdWithItems).toHaveBeenCalledWith(1);
    });

    test('TC_CART_11: Trả về null khi user chưa có giỏ', async () => {
      mockCartModel.findByUserIdWithItems.mockResolvedValue(null);

      const result = await CartService.getCartByUserId(999);

      expect(result).toBeNull();
    });

    test('TC_CART_29: Throw lỗi khi DB lỗi trong getCartByUserId', async () => {
      mockCartModel.findByUserIdWithItems.mockRejectedValue(new Error('Query timeout'));

      await expect(CartService.getCartByUserId(1)).rejects.toThrow('Query timeout');
    });
  });

  // ==========================================================
  // updateItem
  // ==========================================================
  describe('updateItem()', () => {
    test('TC_CART_12: Cập nhật số lượng item thành công khi tồn kho đủ', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.updateItem(1, 5);

      expect(result).toBe(true);
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(1, 5);
    });

    test('TC_CART_13: Throw lỗi khi cartItemId không tồn tại', async () => {
      mockCartModel.findItemById.mockResolvedValue(null);

      await expect(CartService.updateItem(999, 1)).rejects.toThrow('Cart item not found');
    });

    test('TC_CART_14: Throw lỗi khi số lượng vượt tồn kho', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 3 });

      await expect(CartService.updateItem(1, 10)).rejects.toThrow('Insufficient stock. Available: 3');
    });

    test('TC_CART_15: Throw lỗi khi variant đã bị xóa (null)', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.updateItem(1, 1)).rejects.toThrow('Insufficient stock. Available: 0');
    });
  });

  // ==========================================================
  // removeItem
  // ==========================================================
  describe('removeItem()', () => {
    test('TC_CART_16: Xóa item khỏi giỏ hàng thành công', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1 });
      mockCartModel.removeItem.mockResolvedValue(true);

      const result = await CartService.removeItem(1);

      expect(result).toBe(true);
      expect(mockCartModel.removeItem).toHaveBeenCalledWith(1);
    });

    test('TC_CART_17: Throw lỗi khi cartItemId không tồn tại', async () => {
      mockCartModel.findItemById.mockResolvedValue(null);

      await expect(CartService.removeItem(999)).rejects.toThrow('Cart item not found');
    });
  });

  // ==========================================================
  // clearCart
  // ==========================================================
  describe('clearCart()', () => {
    test('TC_CART_18: Xóa toàn bộ giỏ hàng thành công', async () => {
      mockCartModel.clearCartItems.mockResolvedValue(true);

      const result = await CartService.clearCart(1);

      expect(result).toBe(true);
      expect(mockCartModel.clearCartItems).toHaveBeenCalledWith(1);
    });

    test('TC_CART_19: Throw lỗi khi DB lỗi', async () => {
      mockCartModel.clearCartItems.mockRejectedValue(new Error('DB error'));

      await expect(CartService.clearCart(1)).rejects.toThrow('DB error');
    });
  });

  // ==========================================================
  // restoreCartFromOrder
  // ==========================================================
  describe('restoreCartFromOrder()', () => {
    const mockOrder = {
      id: 50,
      user_id: 1,
      payment_method: 'VNPAY',
      payment_status: 'unpaid',
      order_items: [
        { variant_id: 5, variant_name: 'Size L', product_name: 'Chả vịt', quantity: 2 },
        { variant_id: 8, variant_name: 'Size M', product_name: 'Giò bò', quantity: 1 },
      ],
    };

    test('TC_CART_20: Khôi phục giỏ hàng từ đơn VNPay unpaid thành công', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 20 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      const result = await CartService.restoreCartFromOrder(1, 50);

      expect(result).toEqual({ cart_id: 10, restored_items: 2 });
      expect(mockCartModel.addItem).toHaveBeenCalledTimes(2);
    });

    test('TC_CART_21: Throw lỗi khi order không tồn tại', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(null);

      await expect(CartService.restoreCartFromOrder(1, 999)).rejects.toThrow('Order not found');
    });

    test('TC_CART_22: Throw lỗi khi order không thuộc user', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, user_id: 99 });

      await expect(CartService.restoreCartFromOrder(1, 50)).rejects.toThrow('Order does not belong to this user');
    });

    test('TC_CART_23: Throw lỗi khi order không phải VNPAY', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, payment_method: 'COD' });

      await expect(CartService.restoreCartFromOrder(1, 50)).rejects.toThrow('Only unpaid VNPay orders can be restored');
    });

    test('TC_CART_24: Throw lỗi khi order đã thanh toán (paid)', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, payment_status: 'paid' });

      await expect(CartService.restoreCartFromOrder(1, 50)).rejects.toThrow('Only unpaid VNPay orders can be restored');
    });

    test('TC_CART_25: Throw lỗi khi variant hết hàng trong quá trình restore', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 1 });

      await expect(CartService.restoreCartFromOrder(1, 50)).rejects.toThrow(/Insufficient stock/);
    });

    test('TC_CART_26: Throw lỗi khi variant đã bị xóa trong quá trình restore', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.restoreCartFromOrder(1, 50)).rejects.toThrow(/not found/);
    });

    test('TC_CART_27: Cộng dồn khi item đã có trong giỏ khi restore', async () => {
      const orderWith1Item = {
        ...mockOrder,
        order_items: [{ variant_id: 5, variant_name: 'Size L', product_name: 'Chả vịt', quantity: 2 }],
      };
      mockOrderModel.findByIdWithDetails.mockResolvedValue(orderWith1Item);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 20 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 77, quantity: 3 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.restoreCartFromOrder(1, 50);

      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(77, 5); // 3 + 2
      expect(result.restored_items).toBe(1);
    });

    test('TC_CART_28: Trả về restored_items = 0 khi order không có items', async () => {
      const emptyOrder = { ...mockOrder, order_items: [] };
      mockOrderModel.findByIdWithDetails.mockResolvedValue(emptyOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });

      const result = await CartService.restoreCartFromOrder(1, 50);

      expect(result).toEqual({ cart_id: 10, restored_items: 0 });
    });

    test('TC_CART_30: Trả về restored_items = 0 khi order_items là null', async () => {
      const nullItemsOrder = { ...mockOrder, order_items: null };
      mockOrderModel.findByIdWithDetails.mockResolvedValue(nullItemsOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 10 });

      const result = await CartService.restoreCartFromOrder(1, 50);

      expect(result).toEqual({ cart_id: 10, restored_items: 0 });
    });
  });
});

/**
 * Unit Test: cartService.js
 * Người thực hiện: Cường
 * Chức năng: Cart Service - Quản lý giỏ hàng
 * Tổng: 35 Test Cases (32 PASS + 3 FAIL do phát hiện lỗ hổng)
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
  // getOrCreateCart()
  // ==========================================================
  describe('getOrCreateCart()', () => {
    // TC_CART_09
    test('TC_CART_09: Giỏ đã tồn tại → trả về giỏ cũ, không gọi create', async () => {
      const existingCart = { id: 42, user_id: 1 };
      mockCartModel.findByUserId.mockResolvedValue(existingCart);

      const result = await CartService.getOrCreateCart(1);

      expect(result).toEqual({ id: 42, user_id: 1 });
      expect(mockCartModel.findByUserId).toHaveBeenCalledWith(1);
      expect(mockCartModel.create).not.toHaveBeenCalled();
    });

    // TC_CART_10
    test('TC_CART_10: Chưa có giỏ → tạo giỏ mới và trả về', async () => {
      mockCartModel.findByUserId.mockResolvedValue(null);
      mockCartModel.create.mockResolvedValue({ id: 99 });

      const result = await CartService.getOrCreateCart(2);

      expect(result).toEqual({ id: 99 });
      expect(mockCartModel.create).toHaveBeenCalledWith(2);
    });

    // TC_CART_13
    test('TC_CART_13: Throw lỗi khi findByUserId ném lỗi DB', async () => {
      mockCartModel.findByUserId.mockRejectedValue(new Error('DB connection error'));

      await expect(CartService.getOrCreateCart(1)).rejects.toThrow('DB connection error');
      expect(mockCartModel.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // addItem()
  // ==========================================================
  describe('addItem()', () => {
    // TC_CART_01
    test('TC_CART_01: Thêm mới item vào giỏ khi variant chưa có trong giỏ', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      const result = await CartService.addItem(1, 5, 2);

      expect(result).toEqual({ cart_id: 1 });
      expect(mockCartModel.addItem).toHaveBeenCalledWith(1, 5, 2);
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });

    // TC_CART_02
    test('TC_CART_02: Cộng dồn số lượng khi variant đã có trong giỏ', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 100, quantity: 3 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.addItem(1, 5, 2);

      expect(result).toEqual({ cart_id: 1 });
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(100, 5); // 3 + 2
      expect(mockCartModel.addItem).not.toHaveBeenCalled();
    });

    // TC_CART_03
    test('TC_CART_03: Throw lỗi khi tồn kho không đủ', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 1 });

      await expect(CartService.addItem(1, 5, 5)).rejects.toThrow('Insufficient stock. Available: 1');
    });

    // TC_CART_04
    test('TC_CART_04: Throw lỗi khi product variant không tồn tại', async () => {
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.addItem(1, 9999, 1)).rejects.toThrow('Product variant not found');
    });

    // TC_CART_14
    test('TC_CART_14: Throw lỗi khi tổng quantity (cũ + mới) vượt quá tồn kho', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 100, quantity: 8 });

      await expect(CartService.addItem(1, 5, 5)).rejects.toThrow('Insufficient stock. Available: 10');
      expect(mockCartModel.updateItemQuantity).not.toHaveBeenCalled();
    });

    // TC_CART_30 — Phát hiện lỗ hổng: quantity=0
    test('TC_CART_30: Vẫn thêm item khi quantity=0 — service không validate quantity > 0', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      // Bug: service cho phép quantity=0 mà không chặn
      const result = await CartService.addItem(1, 5, 0);
      expect(mockCartModel.addItem).toHaveBeenCalledWith(1, 5, 0);
    });

    // TC_CART_31 — Phát hiện lỗ hổng: quantity âm
    test('TC_CART_31: Vẫn thêm item khi quantity âm — service không validate quantity > 0', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      // Bug: service cho phép quantity=-1 mà không chặn
      const result = await CartService.addItem(1, 5, -1);
      expect(mockCartModel.addItem).toHaveBeenCalledWith(1, 5, -1);
    });

    // TC_CART_33 — Test FAIL: Kỳ vọng throw nhưng service CHƯA có validation
    test('TC_CART_33: Phải throw lỗi khi quantity=0 — service CHƯA validate', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      await expect(CartService.addItem(1, 5, 0))
        .rejects.toThrow('Quantity must be greater than 0');
    });

    // TC_CART_34 — Test FAIL: Kỳ vọng throw nhưng service CHƯA có validation
    test('TC_CART_34: Phải throw lỗi khi quantity âm (-1) — service CHƯA validate', async () => {
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      await expect(CartService.addItem(1, 5, -1))
        .rejects.toThrow('Quantity must be greater than 0');
    });
  });

  // ==========================================================
  // updateItem()
  // ==========================================================
  describe('updateItem()', () => {
    // TC_CART_05
    test('TC_CART_05: Cập nhật số lượng item thành công khi tồn kho đủ', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.updateItem(1, 4);

      expect(result).toBe(true);
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(1, 4);
    });

    // TC_CART_06
    test('TC_CART_06: Throw lỗi khi cartItemId không tồn tại trong updateItem', async () => {
      mockCartModel.findItemById.mockResolvedValue(null);

      await expect(CartService.updateItem(9999, 2)).rejects.toThrow('Cart item not found');
    });

    // TC_CART_15
    test('TC_CART_15: Throw lỗi khi variant của cart item không còn tồn tại trong DB', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.updateItem(1, 2)).rejects.toThrow('Insufficient stock. Available: 0');
    });

    // TC_CART_16
    test('TC_CART_16: Throw lỗi khi số lượng cập nhật vượt quá tồn kho', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 2 });

      await expect(CartService.updateItem(1, 10)).rejects.toThrow('Insufficient stock. Available: 2');
    });

    // TC_CART_32 — Phát hiện lỗ hổng: quantity=0
    test('TC_CART_32: Vẫn update khi quantity=0 — service không validate quantity > 0', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      // Bug: service cho phép quantity=0 mà không chặn
      const result = await CartService.updateItem(1, 0);
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(1, 0);
    });

    // TC_CART_35 — Test FAIL: Kỳ vọng throw nhưng service CHƯA có validation
    test('TC_CART_35: Phải throw lỗi khi cập nhật quantity=0 — service CHƯA validate', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1, product_variant_id: 5 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      await expect(CartService.updateItem(1, 0))
        .rejects.toThrow('Quantity must be greater than 0');
    });
  });

  // ==========================================================
  // removeItem()
  // ==========================================================
  describe('removeItem()', () => {
    // TC_CART_07
    test('TC_CART_07: Xóa item khỏi giỏ hàng thành công', async () => {
      mockCartModel.findItemById.mockResolvedValue({ id: 1 });
      mockCartModel.removeItem.mockResolvedValue(true);

      const result = await CartService.removeItem(1);

      expect(result).toBe(true);
      expect(mockCartModel.removeItem).toHaveBeenCalledWith(1);
    });

    // TC_CART_08
    test('TC_CART_08: Throw lỗi khi cartItemId không tồn tại trong removeItem', async () => {
      mockCartModel.findItemById.mockResolvedValue(null);

      await expect(CartService.removeItem(9999)).rejects.toThrow('Cart item not found');
    });
  });

  // ==========================================================
  // clearCart()
  // ==========================================================
  describe('clearCart()', () => {
    // TC_CART_11
    test('TC_CART_11: Xóa toàn bộ items trong giỏ thành công', async () => {
      mockCartModel.clearCartItems.mockResolvedValue(true);

      const result = await CartService.clearCart(42);

      expect(result).toBe(true);
      expect(mockCartModel.clearCartItems).toHaveBeenCalledWith(42);
    });

    // TC_CART_12
    test('TC_CART_12: Throw lỗi khi clearCartItems thất bại', async () => {
      mockCartModel.clearCartItems.mockRejectedValue(new Error('Cart not found'));

      await expect(CartService.clearCart(9999)).rejects.toThrow('Cart not found');
    });
  });

  // ==========================================================
  // getCartByUserId()
  // ==========================================================
  describe('getCartByUserId()', () => {
    // TC_CART_26
    test('TC_CART_26: Trả về cart object khi userId tồn tại', async () => {
      const cartObj = { id: 1, user_id: 1, items: [] };
      mockCartModel.findByUserIdWithItems.mockResolvedValue(cartObj);

      const result = await CartService.getCartByUserId(1);

      expect(result).toEqual(cartObj);
    });

    // TC_CART_27
    test('TC_CART_27: Trả về null khi userId không có giỏ hàng', async () => {
      mockCartModel.findByUserIdWithItems.mockResolvedValue(null);

      const result = await CartService.getCartByUserId(9999);

      expect(result).toBeNull();
    });

    // TC_CART_28
    test('TC_CART_28: Throw lỗi khi model ném lỗi DB trong getCartByUserId', async () => {
      mockCartModel.findByUserIdWithItems.mockRejectedValue(new Error('DB error'));

      await expect(CartService.getCartByUserId(1)).rejects.toThrow('DB error');
    });
  });

  // ==========================================================
  // restoreCartFromOrder()
  // ==========================================================
  describe('restoreCartFromOrder()', () => {
    const mockOrder = {
      id: 5,
      user_id: 1,
      payment_method: 'VNPAY',
      payment_status: 'unpaid',
      order_items: [
        { variant_id: 5, variant_name: 'Size L', product_name: 'Táo', quantity: 2 },
      ],
    };

    // TC_CART_17
    test('TC_CART_17: Throw lỗi khi orderId không tồn tại trong DB', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(null);

      await expect(CartService.restoreCartFromOrder(1, 9999)).rejects.toThrow('Order not found');
    });

    // TC_CART_18
    test('TC_CART_18: Throw lỗi khi đơn hàng không thuộc về user hiện tại', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, user_id: 2 });

      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow('Order does not belong to this user');
    });

    // TC_CART_19
    test('TC_CART_19: Throw lỗi khi đơn hàng không phải VNPay', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, payment_method: 'COD' });

      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow('Only unpaid VNPay orders can be restored');
    });

    // TC_CART_20
    test('TC_CART_20: Throw lỗi khi đơn VNPAY đã được thanh toán', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, payment_status: 'paid' });

      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow('Only unpaid VNPay orders can be restored');
    });

    // TC_CART_21
    test('TC_CART_21: Khôi phục thành công, trả về restored_items=0 khi order không có items', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue({ ...mockOrder, order_items: [] });
      mockCartModel.findByUserId.mockResolvedValue({ id: 42 });

      const result = await CartService.restoreCartFromOrder(1, 5);

      expect(result).toEqual({ cart_id: 42, restored_items: 0 });
      expect(mockCartModel.addItem).not.toHaveBeenCalled();
    });

    // TC_CART_22
    test('TC_CART_22: Thêm mới item vào giỏ khi chưa có item đó lúc khôi phục', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 42 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 10 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue(null);
      mockCartModel.addItem.mockResolvedValue(true);

      const result = await CartService.restoreCartFromOrder(1, 5);

      expect(result).toEqual({ cart_id: 42, restored_items: 1 });
      expect(mockCartModel.addItem).toHaveBeenCalledWith(42, 5, 2);
    });

    // TC_CART_23
    test('TC_CART_23: Cập nhật quantity khi item đã tồn tại trong giỏ lúc khôi phục', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 42 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 20 });
      mockCartModel.findItemByCartAndVariant.mockResolvedValue({ id: 77, quantity: 3 });
      mockCartModel.updateItemQuantity.mockResolvedValue(true);

      const result = await CartService.restoreCartFromOrder(1, 5);

      expect(result).toEqual({ cart_id: 42, restored_items: 1 });
      expect(mockCartModel.updateItemQuantity).toHaveBeenCalledWith(77, 5); // 3 + 2
    });

    // TC_CART_24
    test('TC_CART_24: Throw lỗi khi variant của order item không còn tồn tại', async () => {
      mockOrderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      mockCartModel.findByUserId.mockResolvedValue({ id: 42 });
      mockProductModel.findVariantById.mockResolvedValue(null);

      await expect(CartService.restoreCartFromOrder(1, 5))
        .rejects.toThrow('Product variant Size L not found');
    });

    // TC_CART_25
    test('TC_CART_25: Throw lỗi khi tồn kho không đủ để khôi phục item từ đơn hàng', async () => {
      const orderBigQty = {
        ...mockOrder,
        order_items: [{ variant_id: 5, variant_name: 'Size L', product_name: 'Táo', quantity: 5 }],
      };
      mockOrderModel.findByIdWithDetails.mockResolvedValue(orderBigQty);
      mockCartModel.findByUserId.mockResolvedValue({ id: 42 });
      mockProductModel.findVariantById.mockResolvedValue({ id: 5, stock: 2 });

      await expect(CartService.restoreCartFromOrder(1, 5))
        .rejects.toThrow('Insufficient stock for Táo. Available: 2, Requested: 5');
    });

    // TC_CART_29
    test('TC_CART_29: Trả về restored_items=0 khi order.order_items là undefined', async () => {
      const orderNoItems = { ...mockOrder, order_items: undefined };
      mockOrderModel.findByIdWithDetails.mockResolvedValue(orderNoItems);
      mockCartModel.findByUserId.mockResolvedValue({ id: 1 });

      const result = await CartService.restoreCartFromOrder(1, 5);

      expect(result).toEqual({ cart_id: 1, restored_items: 0 });
    });
  });
});

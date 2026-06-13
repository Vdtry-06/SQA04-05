/**
 * Unit Test — CartService
 * File gốc  : backend/services/cartService.js
 * Test file : backend/__tests__/cartService.test.js
 * Người PT  : Kiên
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock cartModel và productModel,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

// ── Mock toàn bộ models  ────────────────────────────────
jest.mock("../models/index");

// cartService.js có đoạn debug gọi pool.query('SELECT DATABASE()') trực tiếp
// => cần mock thêm config/mysql để tránh kết nối DB thật
// pool.query trả về [[{ db_name: "..." }]] theo cấu trúc MySQL2 destructure
jest.mock("../config/mysql", () => ({
  pool: {
    query: jest.fn().mockResolvedValue([[{ db_name: "test_db" }]]),
  },
}));

const { cartModel, productModel, orderModel } = require("../models/index");
const CartService = require("../services/cartService");

describe("CartService", () => {
  // Reset tất cả mock trước mỗi test để tránh ảnh hưởng lẫn nhau
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getOrCreateCart() ──────────────────────────────────────────────────────
  describe("getOrCreateCart()", () => {
    // TC_CART_09
    test("TC_CART_09 — Giỏ đã tồn tại → trả về giỏ cũ, không gọi create", async () => {
      // Arrange — mock cartModel.findByUserId trả về giỏ đã tồn tại
      const mockCart = { id: 42, user_id: 1 };
      cartModel.findByUserId.mockResolvedValue(mockCart);

      // Act — gọi hàm cần test
      const result = await CartService.getOrCreateCart(1);

      // Assert — trả về đúng cart hiện có, KHÔNG tạo mới
      expect(result).toEqual(mockCart);
      expect(result).toHaveProperty("id", 42);

      // CheckDB — findByUserId được gọi đúng 1 lần với đúng tham số
      expect(cartModel.findByUserId).toHaveBeenCalledTimes(1);
      expect(cartModel.findByUserId).toHaveBeenCalledWith(1);

      // CheckDB — create KHÔNG được gọi vì giỏ đã tồn tại
      expect(cartModel.create).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào được tạo => không cần rollback
    });

    // TC_CART_10
    test("TC_CART_10 — Chưa có giỏ → tạo giỏ mới và trả về", async () => {
      // Arrange — mock findByUserId trả về null (chưa có giỏ); create trả về giỏ mới
      const mockNewCart = { id: 99, user_id: 2 };
      cartModel.findByUserId.mockResolvedValue(null);
      cartModel.create.mockResolvedValue(mockNewCart);

      // Act
      const result = await CartService.getOrCreateCart(2);

      // Assert — trả về giỏ vừa được tạo mới
      expect(result).toEqual(mockNewCart);
      expect(result).toHaveProperty("id", 99);

      // CheckDB — create được gọi đúng 1 lần với đúng userId
      expect(cartModel.create).toHaveBeenCalledTimes(1);
      expect(cartModel.create).toHaveBeenCalledWith(2);

      // CheckDB — findByUserId vẫn được gọi trước để kiểm tra
      expect(cartModel.findByUserId).toHaveBeenCalledTimes(1);
      expect(cartModel.findByUserId).toHaveBeenCalledWith(2);

      // Rollback: dùng mock  => không cần rollback
    });
  });

  // ── addItem() ──────────────────────────────────────────────────────────────
  describe("addItem()", () => {
    // TC_CART_01
    test("TC_CART_01 — Thêm mới item vào giỏ khi variant chưa có trong giỏ", async () => {
      // Arrange — mock variant tồn tại, stock đủ; giỏ hàng đã có; chưa có item này
      const mockVariant = { id: 5, stock: 10 };
      const mockCart = { id: 42 };

      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      cartModel.findItemByCartAndVariant.mockResolvedValue(null);
      cartModel.addItem.mockResolvedValue({ id: 1 });

      // Act — gọi hàm cần test
      const result = await CartService.addItem(1, 5, 2);

      // Assert — trả về đúng cart_id
      expect(result).toEqual({ cart_id: 42 });

      // CheckDB — addItem được gọi đúng tham số
      expect(cartModel.addItem).toHaveBeenCalledTimes(1);
      expect(cartModel.addItem).toHaveBeenCalledWith(42, 5, 2);

      // CheckDB — updateItemQuantity KHÔNG được gọi vì item chưa tồn tại trong giỏ
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào được tạo => không cần rollback
    });

    // TC_CART_02
    test("TC_CART_02 — Cộng dồn số lượng khi variant đã có trong giỏ", async () => {
      // Arrange — giỏ đã có item variant=5, quantity=3; stock=10; thêm quantity=2
      const mockVariant = { id: 5, stock: 10 };
      const mockCart = { id: 42 };
      const existingItem = { id: 10, quantity: 3 };

      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      cartModel.findItemByCartAndVariant.mockResolvedValue(existingItem);
      cartModel.updateItemQuantity.mockResolvedValue(true);

      // Act
      const result = await CartService.addItem(1, 5, 2);

      // Assert
      expect(result).toEqual({ cart_id: 42 });

      // CheckDB — updateItemQuantity được gọi với quantity = 3 + 2 = 5
      expect(cartModel.updateItemQuantity).toHaveBeenCalledTimes(1);
      expect(cartModel.updateItemQuantity).toHaveBeenCalledWith(10, 5);

      // CheckDB — addItem KHÔNG được gọi vì item đã tồn tại trong giỏ
      expect(cartModel.addItem).not.toHaveBeenCalled();
    });

    // TC_CART_03
    test("TC_CART_03 — Throw lỗi khi tồn kho không đủ", async () => {
      // Arrange — variant chỉ còn stock=1, yêu cầu quantity=5
      const mockVariant = { id: 5, stock: 1 };
      productModel.findVariantById.mockResolvedValue(mockVariant);

      // Act & Assert
      await expect(CartService.addItem(1, 5, 5)).rejects.toThrow(
        "Insufficient stock. Available: 1",
      );

      // CheckDB — không có thay đổi DB nào được thực hiện
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_04
    test("TC_CART_04 — Throw lỗi khi product variant không tồn tại", async () => {
      // Arrange — mock productModel.findVariantById trả về null
      productModel.findVariantById.mockResolvedValue(null);

      // Act & Assert
      await expect(CartService.addItem(1, 9999, 1)).rejects.toThrow(
        "Product variant not found",
      );

      // CheckDB — không gọi bất kỳ thao tác nào trên cartModel
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();
    });
  });

  // ── updateItem() ───────────────────────────────────────────────────────────
  describe("updateItem()", () => {
    // TC_CART_05
    test("TC_CART_05 — Cập nhật số lượng item thành công khi tồn kho đủ", async () => {
      // Arrange — cartItem id=1 tồn tại; variant có stock=10; cập nhật quantity=4
      const mockCartItem = { id: 1, product_variant_id: 5 };
      const mockVariant = { id: 5, stock: 10 };

      cartModel.findItemById.mockResolvedValue(mockCartItem);
      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.updateItemQuantity.mockResolvedValue(true);

      // Act
      const result = await CartService.updateItem(1, 4);

      // Assert — trả về true
      expect(result).toBe(true);

      // CheckDB — updateItemQuantity được gọi đúng tham số
      expect(cartModel.updateItemQuantity).toHaveBeenCalledTimes(1);
      expect(cartModel.updateItemQuantity).toHaveBeenCalledWith(1, 4);

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_CART_06
    test("TC_CART_06 — Throw lỗi khi cartItemId không tồn tại trong updateItem", async () => {
      // Arrange — mock cartModel.findItemById trả về null
      cartModel.findItemById.mockResolvedValue(null);

      // Act & Assert
      await expect(CartService.updateItem(9999, 2)).rejects.toThrow(
        "Cart item not found",
      );

      // CheckDB — updateItemQuantity KHÔNG được gọi
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();
    });
  });

  // ── removeItem() ───────────────────────────────────────────────────────────
  describe("removeItem()", () => {
    // TC_CART_07
    test("TC_CART_07 — Xóa item khỏi giỏ hàng thành công", async () => {
      // Arrange — cartItem id=1 tồn tại trong DB
      const mockCartItem = { id: 1, product_variant_id: 5 };
      cartModel.findItemById.mockResolvedValue(mockCartItem);
      cartModel.removeItem.mockResolvedValue(true);

      // Act
      const result = await CartService.removeItem(1);

      // Assert — trả về true
      expect(result).toBe(true);

      // CheckDB — removeItem được gọi đúng id
      expect(cartModel.removeItem).toHaveBeenCalledTimes(1);
      expect(cartModel.removeItem).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_CART_08
    test("TC_CART_08 — Throw lỗi khi cartItemId không tồn tại trong removeItem", async () => {
      // Arrange — mock cartModel.findItemById trả về null
      cartModel.findItemById.mockResolvedValue(null);

      // Act & Assert
      await expect(CartService.removeItem(9999)).rejects.toThrow(
        "Cart item not found",
      );

      // CheckDB — removeItem KHÔNG được gọi
      expect(cartModel.removeItem).not.toHaveBeenCalled();
    });
  });

  // ── clearCart() ────────────────────────────────────────────────────────────
  describe("clearCart()", () => {
    // TC_CART_11
    test("TC_CART_11 — Xóa toàn bộ items trong giỏ thành công", async () => {
      // Arrange — mock clearCartItems thực thi thành công
      cartModel.clearCartItems.mockResolvedValue(true);

      // Act
      const result = await CartService.clearCart(42);

      // Assert — trả về true
      expect(result).toBe(true);

      // CheckDB — clearCartItems được gọi đúng 1 lần với đúng cartId
      expect(cartModel.clearCartItems).toHaveBeenCalledTimes(1);
      expect(cartModel.clearCartItems).toHaveBeenCalledWith(42);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_CART_12
    test("TC_CART_12 — Throw lỗi khi clearCartItems thất bại", async () => {
      // Arrange — mock clearCartItems throw lỗi (DB error hoặc cartId không hợp lệ)
      cartModel.clearCartItems.mockRejectedValue(new Error("Cart not found"));

      // Act & Assert
      await expect(CartService.clearCart(9999)).rejects.toThrow(
        "Cart not found",
      );

      // CheckDB — clearCartItems vẫn được gọi đúng 1 lần với đúng cartId
      expect(cartModel.clearCartItems).toHaveBeenCalledTimes(1);
      expect(cartModel.clearCartItems).toHaveBeenCalledWith(9999);
    });
  });

  // ── getOrCreateCart() — error path ────────────────────────────────────────
  describe("getOrCreateCart() — error path", () => {
    // TC_CART_13
    test("TC_CART_13 — Throw lỗi khi findByUserId throw lỗi DB", async () => {
      // Arrange — mock cartModel.findByUserId throw lỗi DB
      cartModel.findByUserId.mockRejectedValue(
        new Error("DB connection error"),
      );

      // Act & Assert
      await expect(CartService.getOrCreateCart(1)).rejects.toThrow(
        "DB connection error",
      );

      // CheckDB — findByUserId được gọi đúng 1 lần với đúng userId
      expect(cartModel.findByUserId).toHaveBeenCalledTimes(1);
      expect(cartModel.findByUserId).toHaveBeenCalledWith(1);

      // CheckDB — create KHÔNG được gọi vì lỗi xảy ra trước đó
      expect(cartModel.create).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── addItem() — stock overflow on existing item ────────────────────────────
  describe("addItem() — stock overflow on existing item", () => {
    // TC_CART_14
    test("TC_CART_14 — Throw lỗi khi tổng quantity (cũ + mới) vượt quá tồn kho", async () => {
      // Arrange — giỏ đã có item variant=5, quantity=8; stock=10; thêm quantity=5 → 8+5=13 > 10
      const mockVariant = { id: 5, stock: 10 };
      const mockCart = { id: 42 };
      const existingItem = { id: 10, quantity: 8 };

      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      cartModel.findItemByCartAndVariant.mockResolvedValue(existingItem);

      // Act & Assert — tổng 8 + 5 = 13 vượt stock=10
      await expect(CartService.addItem(1, 5, 5)).rejects.toThrow(
        "Insufficient stock. Available: 10",
      );

      // CheckDB — updateItemQuantity KHÔNG được gọi vì lỗi xảy ra trước đó
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // CheckDB — addItem KHÔNG được gọi
      expect(cartModel.addItem).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── updateItem() — variant deleted / insufficient stock ───────────────────
  describe("updateItem() — variant not found or insufficient stock", () => {
    // TC_CART_15
    test("TC_CART_15 — Throw lỗi khi variant của cart item không còn tồn tại trong DB", async () => {
      // Arrange — cartItem tồn tại nhưng variant đã bị xóa (findVariantById → null)
      const mockCartItem = { id: 1, product_variant_id: 5 };
      cartModel.findItemById.mockResolvedValue(mockCartItem);
      productModel.findVariantById.mockResolvedValue(null);

      // Act & Assert — variant null → available stock = 0
      await expect(CartService.updateItem(1, 2)).rejects.toThrow(
        "Insufficient stock. Available: 0",
      );

      // CheckDB — findItemById được gọi đúng 1 lần
      expect(cartModel.findItemById).toHaveBeenCalledTimes(1);
      expect(cartModel.findItemById).toHaveBeenCalledWith(1);

      // CheckDB — updateItemQuantity KHÔNG được gọi
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_CART_16
    test("TC_CART_16 — Throw lỗi khi số lượng cập nhật vượt quá tồn kho", async () => {
      // Arrange — cartItem tồn tại; variant chỉ còn stock=2; cập nhật quantity=10
      const mockCartItem = { id: 1, product_variant_id: 5 };
      const mockVariant = { id: 5, stock: 2 };

      cartModel.findItemById.mockResolvedValue(mockCartItem);
      productModel.findVariantById.mockResolvedValue(mockVariant);

      // Act & Assert
      await expect(CartService.updateItem(1, 10)).rejects.toThrow(
        "Insufficient stock. Available: 2",
      );

      // CheckDB — updateItemQuantity KHÔNG được gọi
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });
  });

  // ── restoreCartFromOrder() ─────────────────────────────────────────────────
  describe("restoreCartFromOrder()", () => {
    // TC_CART_17
    test("TC_CART_17 — Throw lỗi khi orderId không tồn tại trong DB", async () => {
      // Arrange — orderModel.findByIdWithDetails trả về null
      orderModel.findByIdWithDetails.mockResolvedValue(null);

      // Act & Assert
      await expect(CartService.restoreCartFromOrder(1, 9999)).rejects.toThrow(
        "Order not found",
      );

      // CheckDB — findByIdWithDetails được gọi đúng 1 lần với đúng orderId
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledTimes(1);
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledWith(9999);

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_18
    test("TC_CART_18 — Throw lỗi khi đơn hàng không thuộc về user hiện tại", async () => {
      // Arrange — order tồn tại nhưng user_id=2, không khớp với userId=1
      const mockOrder = {
        id: 5,
        user_id: 2,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [],
      };
      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow(
        "Order does not belong to this user",
      );

      // CheckDB — không có thao tác DB nào khác được gọi
      expect(cartModel.addItem).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_19
    test("TC_CART_19 — Throw lỗi khi đơn hàng không phải VNPay hoặc đã thanh toán", async () => {
      // Arrange — order thuộc userId=1 nhưng payment_method="COD" (không phải VNPAY)
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "COD",
        payment_status: "unpaid",
        order_items: [],
      };
      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow(
        "Only unpaid VNPay orders can be restored",
      );

      // CheckDB — không có thao tác giỏ hàng nào được thực hiện
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_20
    test("TC_CART_20 — Throw lỗi khi đơn VNPAY đã được thanh toán", async () => {
      // Arrange — order thuộc userId=1, VNPAY nhưng payment_status="paid"
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "paid",
        order_items: [],
      };
      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow(
        "Only unpaid VNPay orders can be restored",
      );

      // CheckDB — không có thao tác giỏ hàng nào được thực hiện
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_21
    test("TC_CART_21 — Khôi phục thành công, trả về restored_items=0 khi order không có items", async () => {
      // Arrange — order hợp lệ (VNPAY, unpaid, userId=1) nhưng order_items=[]
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [],
      };
      const mockCart = { id: 42 };

      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      cartModel.findByUserId.mockResolvedValue(mockCart);

      // Act
      const result = await CartService.restoreCartFromOrder(1, 5);

      // Assert — không có item nào được khôi phục
      expect(result).toEqual({ cart_id: 42, restored_items: 0 });

      // CheckDB — addItem KHÔNG được gọi vì không có order_items
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_22
    test("TC_CART_22 — Thêm mới item vào giỏ khi chưa có item đó lúc khôi phục", async () => {
      // Arrange — order hợp lệ; order_items có 1 item variant=5, quantity=2; giỏ chưa có item này
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [
          {
            variant_id: 5,
            product_name: "Táo",
            variant_name: "1kg",
            quantity: 2,
          },
        ],
      };
      const mockCart = { id: 42 };
      const mockVariant = { id: 5, stock: 10 };

      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.findItemByCartAndVariant.mockResolvedValue(null);
      cartModel.addItem.mockResolvedValue({ id: 1 });

      // Act
      const result = await CartService.restoreCartFromOrder(1, 5);

      // Assert
      expect(result).toEqual({ cart_id: 42, restored_items: 1 });

      // CheckDB — addItem được gọi đúng tham số
      expect(cartModel.addItem).toHaveBeenCalledTimes(1);
      expect(cartModel.addItem).toHaveBeenCalledWith(42, 5, 2);

      // CheckDB — updateItemQuantity KHÔNG được gọi vì item chưa tồn tại
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_23
    test("TC_CART_23 — Cập nhật quantity khi item đã tồn tại trong giỏ lúc khôi phục", async () => {
      // Arrange — order hợp lệ; order_items có variant=5, quantity=2; giỏ đã có item: quantity=3
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [{ variant_id: 5, quantity: 2 }],
      };
      const mockCart = { id: 42 };
      const mockVariant = { id: 5, stock: 10 };
      const existingItem = { id: 7, quantity: 3 };

      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      productModel.findVariantById.mockResolvedValue(mockVariant);
      cartModel.findItemByCartAndVariant.mockResolvedValue(existingItem);
      cartModel.updateItemQuantity.mockResolvedValue(true);

      // Act
      const result = await CartService.restoreCartFromOrder(1, 5);

      // Assert
      expect(result).toEqual({ cart_id: 42, restored_items: 1 });

      // CheckDB — updateItemQuantity được gọi với (existingItemId, 3+2=5)
      expect(cartModel.updateItemQuantity).toHaveBeenCalledTimes(1);
      expect(cartModel.updateItemQuantity).toHaveBeenCalledWith(7, 5);

      // CheckDB — addItem KHÔNG được gọi vì item đã tồn tại
      expect(cartModel.addItem).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_24
    test("TC_CART_24 — Throw lỗi khi variant của order item không còn tồn tại", async () => {
      // Arrange — order hợp lệ; order_items có variant_id=99 đã bị xóa khỏi DB
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [{ variant_id: 99, variant_name: "Size L", quantity: 1 }],
      };
      const mockCart = { id: 42 };

      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      productModel.findVariantById.mockResolvedValue(null);

      // Act & Assert
      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow(
        "Product variant Size L not found",
      );

      // CheckDB — addItem và updateItemQuantity KHÔNG được gọi
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_CART_25
    test("TC_CART_25 — Throw lỗi khi tồn kho không đủ để khôi phục item từ đơn hàng", async () => {
      // Arrange — order hợp lệ; order_items có variant=5, quantity=5; variant chỉ còn stock=2
      const mockOrder = {
        id: 5,
        user_id: 1,
        payment_method: "VNPAY",
        payment_status: "unpaid",
        order_items: [{ variant_id: 5, product_name: "Táo", quantity: 5 }],
      };
      const mockCart = { id: 42 };
      const mockVariant = { id: 5, stock: 2 };

      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);
      cartModel.findByUserId.mockResolvedValue(mockCart);
      productModel.findVariantById.mockResolvedValue(mockVariant);

      // Act & Assert — stock=2 < quantity=5
      await expect(CartService.restoreCartFromOrder(1, 5)).rejects.toThrow(
        "Insufficient stock for Táo. Available: 2, Requested: 5",
      );

      // CheckDB — addItem và updateItemQuantity KHÔNG được gọi
      expect(cartModel.addItem).not.toHaveBeenCalled();
      expect(cartModel.updateItemQuantity).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });
  });
});

// ─── getCartByUserId bổ sung branch ─────────────────────────────────────────
describe("getCartByUserId()", () => {
  // TC_CART_16
  test("TC_CART_26 — Trả về cart object khi userId tồn tại", async () => {
    // Arrange — mock trả về cart object
    const mockCart = { id: 1, user_id: 1, items: [] };
    cartModel.findByUserIdWithItems.mockResolvedValue(mockCart);

    // Act
    const result = await CartService.getCartByUserId(1);

    // Assert
    expect(result).toEqual(mockCart);
    expect(cartModel.findByUserIdWithItems).toHaveBeenCalledTimes(1);
    expect(cartModel.findByUserIdWithItems).toHaveBeenCalledWith(1);
  });

  // TC_CART_17
  test("TC_CART_27 — Trả về null khi userId không có giỏ hàng", async () => {
    // Arrange — mock trả về null
    cartModel.findByUserIdWithItems.mockResolvedValue(null);

    // Act
    const result = await CartService.getCartByUserId(9999);

    // Assert
    expect(result).toBeNull();
    expect(cartModel.findByUserIdWithItems).toHaveBeenCalledWith(9999);
  });

  // TC_CART_18
  test("TC_CART_28 — Throw lỗi khi model throw lỗi DB trong getCartByUserId", async () => {
    // Arrange — mock throw lỗi
    cartModel.findByUserIdWithItems.mockRejectedValue(new Error("DB error"));

    // Act & Assert
    await expect(CartService.getCartByUserId(1)).rejects.toThrow("DB error");
    expect(cartModel.findByUserIdWithItems).toHaveBeenCalledWith(1);
  });
});

// ─── order_items bổ sung branch là null/undefined ───────────────────────────
describe("restoreCartFromOrder() — order_items null branch", () => {
  test("TC_CART_29 — Trả về restored_items=0 khi order.order_items là undefined", async () => {
    // Arrange — order không có field order_items (undefined) → ternary trả về 0
    // Phải là VNPAY + unpaid mới qua được validation
    const mockOrder = {
      id: 5,
      user_id: 1,
      payment_method: "VNPAY",
      payment_status: "unpaid",
      // order_items: undefined — không có field này
    };
    const mockCart = { id: 1 };
    cartModel.findByUserId.mockResolvedValue(mockCart);
    orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);

    // Act
    const result = await CartService.restoreCartFromOrder(1, 5);

    // Assert — order_items undefined → restored_items = 0
    expect(result.restored_items).toBe(0);
    expect(result.cart_id).toBe(1);
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("addItem() — số lượng không hợp lệ", () => {
  // TC_CART_30
  test("TC_CART_30 — Vẫn thêm item khi quantity=0 (service không validate quantity > 0)", async () => {
    // Service không validate quantity có dương không — đây là lỗ hổng
    const mockVariant = { id: 5, stock: 10 };
    const mockCart = { id: 42 };
    cartModel.findByUserId.mockResolvedValue(mockCart);
    productModel.findVariantById.mockResolvedValue(mockVariant);
    cartModel.findItemByCartAndVariant.mockResolvedValue(null);
    cartModel.addItem.mockResolvedValue(true);

    // quantity=0, stock=10 → 0 < 10 không throw → addItem được gọi
    const result = await CartService.addItem(1, 5, 0);

    // Service KHÔNG chặn quantity=0 → đây là lỗ hổng cần ghi nhận
    expect(cartModel.addItem).toHaveBeenCalledWith(42, 5, 0);
    expect(result).toBeDefined();
  });

  // TC_CART_31
  test("TC_CART_31 — Throw lỗi khi quantity âm vượt quá stock check (stock=5, quantity=-1: -1 < 5 không throw)", async () => {
    // quantity=-1 → stock=5, -1 < 5 → không throw tồn kho — đây là lỗ hổng service không validate âm
    const mockVariant = { id: 5, stock: 5 };
    const mockCart = { id: 42 };
    cartModel.findByUserId.mockResolvedValue(mockCart);
    productModel.findVariantById.mockResolvedValue(mockVariant);
    cartModel.findItemByCartAndVariant.mockResolvedValue(null);
    cartModel.addItem.mockResolvedValue(true);

    // Service KHÔNG chặn quantity âm
    const result = await CartService.addItem(1, 5, -1);
    expect(cartModel.addItem).toHaveBeenCalledWith(42, 5, -1);
    expect(result).toBeDefined();
  });
});

describe("updateItem() — số lượng không hợp lệ", () => {
  // TC_CART_32
  test("TC_CART_32 — Vẫn update khi quantity=0 (service không validate quantity > 0)", async () => {
    // Service chỉ kiểm tra stock >= quantity, không validate quantity > 0
    const mockCartItem = { id: 1, product_variant_id: 5 };
    const mockVariant = { id: 5, stock: 10 };
    cartModel.findItemById.mockResolvedValue(mockCartItem);
    productModel.findVariantById.mockResolvedValue(mockVariant);
    cartModel.updateItemQuantity.mockResolvedValue(true);

    // quantity=0, stock=10 → 0 không < 10, không bị block
    const result = await CartService.updateItem(1, 0);

    // Service KHÔNG chặn quantity=0 → lỗ hổng
    expect(cartModel.updateItemQuantity).toHaveBeenCalledWith(1, 0);
    expect(result).toBe(true);
  });
});

// Các test dưới đây SẼ FAIL vì service chưa validate quantity > 0
// Khi sửa service thêm validation → test sẽ PASS
describe("addItem() — service phải validate quantity > 0", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_CART_33
  test("TC_CART_33 — Phải throw lỗi khi quantity=0 (không có ý nghĩa nghiệp vụ)", async () => {
    // Nghiệp vụ: thêm 0 sản phẩm vào giỏ là vô nghĩa, phải bị chặn
    // Hiện tại: service chỉ check stock >= quantity → 0 < stock → KHÔNG throw
    // Cần sửa: thêm if (quantity <= 0) throw new Error('Quantity must be greater than 0')
    await expect(CartService.addItem(1, 5, 0)).rejects.toThrow(
      "Quantity must be greater than 0",
    );
  });

  // TC_CART_34
  test("TC_CART_34 — Phải throw lỗi khi quantity âm (-1)", async () => {
    // Nghiệp vụ: số lượng âm là không hợp lệ về mặt logic
    // Hiện tại: service KHÔNG validate → KHÔNG throw
    await expect(CartService.addItem(1, 5, -1)).rejects.toThrow(
      "Quantity must be greater than 0",
    );
  });
});

describe("updateItem() — service phải validate quantity > 0", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_CART_35
  test("TC_CART_35 — Phải throw lỗi khi cập nhật quantity=0 (xóa item phải dùng removeItem)", async () => {
    // Nghiệp vụ: updateItem với quantity=0 là vô nghĩa (nên dùng removeItem thay thế)
    // Hiện tại: service KHÔNG validate → vẫn gọi updateItemQuantity với 0
    // Cần sửa: thêm if (quantity <= 0) throw new Error('Quantity must be greater than 0')
    await expect(CartService.updateItem(1, 0)).rejects.toThrow(
      "Quantity must be greater than 0",
    );
  });
});

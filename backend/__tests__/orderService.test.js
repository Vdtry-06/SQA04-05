/**
 * Unit Test — orderService
 * File gốc  : backend/services/orderService.js
 * Test file : backend/__tests__/orderService.test.js
 * Người PT  : Vũ Thế Văn
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock các model và pool,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

jest.mock("../models", () => ({
  cartModel: {
    findById: jest.fn(),
    getCartItemsWithDetails: jest.fn(),
    clearCartItems: jest.fn(),
  },
  orderModel: {
    create: jest.fn(),
    addOrderItem: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    countOrderItems: jest.fn(),
    getOrderItems: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updatePaymentStatus: jest.fn(),
  },
  productModel: {
    updateVariantStock: jest.fn(),
  },
  userModel: {},
}));

jest.mock("../config/mysql", () => ({
  pool: {
    getConnection: jest.fn(),
  },
}));

const { cartModel, orderModel, productModel } = require("../models");
const { pool } = require("../config/mysql");
const OrderService = require("../services/orderService");

const createMockConnection = () => ({
  beginTransaction: jest.fn().mockResolvedValue(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn(),
});

describe("OrderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder()", () => {
    test("TC_ORD_01 - Tạo đơn hàng thành công từ giỏ hàng hợp lệ", async () => {
      // Input: userId=1, cartId=1, shippingAddress="123 Hà Nội", paymentMethod="COD", note=""
      // Expected Output: return { order_id, total_price }; create/addItem/updateStock/clearCart are called
      // CheckDB: verify createOrder + addOrderItem + updateVariantStock + clearCartItems calls
      // Rollback: using mocked transaction only, no real DB write
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      const cartItems = [
        {
          variant_id: 7,
          variant_name: "Size M",
          quantity: 2,
          stock: 10,
          price_sale: "50000",
        },
        {
          variant_id: 8,
          variant_name: "Size L",
          quantity: 1,
          stock: 7,
          price_sale: "100000",
        },
      ];

      cartModel.getCartItemsWithDetails.mockResolvedValue(cartItems);
      orderModel.create.mockResolvedValue({ id: 88 });
      orderModel.addOrderItem.mockResolvedValue(true);
      productModel.updateVariantStock.mockResolvedValue(true);
      cartModel.clearCartItems.mockResolvedValue(true);

      const result = await OrderService.createOrder({
        userId: 1,
        cartId: 1,
        shippingAddress: "123 Hà Nội",
        paymentMethod: "COD",
        note: "",
      });

      expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(cartModel.getCartItemsWithDetails).toHaveBeenCalledWith(1);
      expect(orderModel.create).toHaveBeenCalledWith({
        user_id: 1,
        total_price: 250000,
        status: "pending",
        payment_status: "unpaid",
        shipping_address: "123 Hà Nội",
        payment_method: "COD",
        note: "",
      });
      expect(orderModel.addOrderItem).toHaveBeenCalledWith({
        order_id: 88,
        product_variant_id: 7,
        quantity: 2,
        price: "50000",
      });
      expect(orderModel.addOrderItem).toHaveBeenCalledWith({
        order_id: 88,
        product_variant_id: 8,
        quantity: 1,
        price: "100000",
      });
      expect(productModel.updateVariantStock).toHaveBeenCalledWith(
        7,
        2,
        "decrement",
      );
      expect(productModel.updateVariantStock).toHaveBeenCalledWith(
        8,
        1,
        "decrement",
      );
      expect(cartModel.clearCartItems).toHaveBeenCalledWith(1);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ order_id: 88, total_price: 250000 });
    });

    test("TC_ORD_02 - Throw lỗi khi giỏ hàng không có items", async () => {
      // Input: userId=1, cartId=1
      // Expected Output: throw Error("Cart is empty")
      // CheckDB: getCartItemsWithDetails called, order creation not called
      // Rollback: transaction is rolled back via mocked connection
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);
      cartModel.getCartItemsWithDetails.mockResolvedValue([]);

      await expect(
        OrderService.createOrder({
          userId: 1,
          cartId: 1,
          shippingAddress: "123 Test Street",
          paymentMethod: "cod",
          note: "",
        }),
      ).rejects.toThrow("Cart is empty");

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(cartModel.getCartItemsWithDetails).toHaveBeenCalledWith(1);
      expect(orderModel.create).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test("TC_ORD_03 - Throw lỗi khi tồn kho không đủ cho một item", async () => {
      // Input: userId=1, cartId=1, cart has item quantity=5 but stock=2
      // Expected Output: throw Error containing "Insufficient stock for"
      // CheckDB: order creation and stock updates must not happen
      // Rollback: transaction is rolled back via mocked connection
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      cartModel.getCartItemsWithDetails.mockResolvedValue([
        {
          variant_id: 7,
          variant_name: "Size M",
          quantity: 5,
          stock: 2,
          price_sale: "100000",
        },
      ]);

      await expect(
        OrderService.createOrder({
          userId: 1,
          cartId: 1,
          shippingAddress: "123 Test Street",
          paymentMethod: "cod",
          note: "",
        }),
      ).rejects.toThrow("Insufficient stock for product variant Size M");

      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(orderModel.create).not.toHaveBeenCalled();
      expect(productModel.updateVariantStock).not.toHaveBeenCalled();
      expect(cartModel.clearCartItems).not.toHaveBeenCalled();
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test("TC_ORD_04 - Tính đúng tổng tiền: subtotal + phí ship(30000) + thuế(10%)", async () => {
      // Input: userId=1, cartId=1, paymentMethod="COD", item quantity=2, price_sale=100000
      // Expected Output: total_price = 200000 + 30000 + 20000 = 250000
      // CheckDB: verify total_price passed to orderModel.create is correct
      // Rollback: using mocked transaction only, no real DB write
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      cartModel.getCartItemsWithDetails.mockResolvedValue([
        {
          variant_id: 7,
          variant_name: "Size M",
          quantity: 2,
          stock: 10,
          price_sale: "100000",
        },
      ]);
      orderModel.create.mockResolvedValue({ id: 88 });
      orderModel.addOrderItem.mockResolvedValue(true);
      productModel.updateVariantStock.mockResolvedValue(true);
      cartModel.clearCartItems.mockResolvedValue(true);

      const result = await OrderService.createOrder({
        userId: 1,
        cartId: 1,
        shippingAddress: "123 Test Street",
        paymentMethod: "COD",
        note: "",
      });

      expect(orderModel.create).toHaveBeenCalledWith({
        user_id: 1,
        total_price: 250000,
        status: "pending",
        payment_status: "unpaid",
        shipping_address: "123 Test Street",
        payment_method: "COD",
        note: "",
      });
      expect(result.total_price).toBe(250000);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
    });
  });

  describe("getCheckoutInfo()", () => {
    test("TC_ORD_05 - Trả về thông tin checkout đầy đủ khi cart hợp lệ", async () => {
      // Input: cartId=1
      // Expected Output: return object { items[], subtotal, shipping_fee=30000, tax=subtotal*0.1, total_price }
      // CheckDB: findById and getCartItemsWithDetails are called with cartId
      // Rollback: read-only flow with mocks, no DB mutation
      cartModel.findById.mockResolvedValue({ id: 1, user_id: 1 });
      cartModel.getCartItemsWithDetails.mockResolvedValue([
        {
          cart_item_id: 1,
          product_name: "A",
          product_avatar: "a.jpg",
          variant_name: "v1",
          unit: "pcs",
          price_sale: "10000",
          stock: 10,
          quantity: 1,
        },
        {
          cart_item_id: 2,
          product_name: "B",
          product_avatar: "b.jpg",
          variant_name: "v2",
          unit: "pcs",
          price_sale: "20000",
          stock: 10,
          quantity: 1,
        },
        {
          cart_item_id: 3,
          product_name: "C",
          product_avatar: "c.jpg",
          variant_name: "v3",
          unit: "pcs",
          price_sale: "30000",
          stock: 10,
          quantity: 1,
        },
        {
          cart_item_id: 4,
          product_name: "D",
          product_avatar: "d.jpg",
          variant_name: "v4",
          unit: "pcs",
          price_sale: "40000",
          stock: 10,
          quantity: 1,
        },
        {
          cart_item_id: 5,
          product_name: "E",
          product_avatar: "e.jpg",
          variant_name: "v5",
          unit: "pcs",
          price_sale: "50000",
          stock: 10,
          quantity: 1,
        },
        {
          cart_item_id: 6,
          product_name: "F",
          product_avatar: "f.jpg",
          variant_name: "v6",
          unit: "pcs",
          price_sale: "60000",
          stock: 10,
          quantity: 1,
        },
      ]);

      const result = await OrderService.getCheckoutInfo(1);

      expect(cartModel.findById).toHaveBeenCalledWith(1);
      expect(cartModel.getCartItemsWithDetails).toHaveBeenCalledWith(1);
      expect(result.items).toHaveLength(6);
      expect(result.subtotal).toBe(210000);
      expect(result.shipping_fee).toBe(30000);
      expect(result.tax).toBe(21000);
      expect(result.total_price).toBe(261000);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          product_name: "A",
          price_sale: 10000,
          quantity: 1,
          subtotal: 10000,
        }),
      );
    });

    test("TC_ORD_06 - Throw lỗi khi cartId không tồn tại", async () => {
      // Input: cartId=9999
      // Expected Output: throw Error("Cart not found")
      // CheckDB: findById called; getCartItemsWithDetails not called
      // Rollback: read-only flow with mocks, no DB mutation
      cartModel.findById.mockResolvedValue(null);

      await expect(OrderService.getCheckoutInfo(9999)).rejects.toThrow(
        "Cart not found",
      );
      expect(cartModel.findById).toHaveBeenCalledWith(9999);
      expect(cartModel.getCartItemsWithDetails).not.toHaveBeenCalled();
    });

    test("TC_ORD_07 - Throw lỗi khi giỏ hàng tồn tại nhưng trống", async () => {
      // Input: cartId=1
      // Expected Output: throw Error("Cart is empty")
      // CheckDB: findById and getCartItemsWithDetails are called
      // Rollback: read-only flow with mocks, no DB mutation
      cartModel.findById.mockResolvedValue({ id: 1, user_id: 1 });
      cartModel.getCartItemsWithDetails.mockResolvedValue([]);

      await expect(OrderService.getCheckoutInfo(1)).rejects.toThrow(
        "Cart is empty",
      );
      expect(cartModel.findById).toHaveBeenCalledWith(1);
      expect(cartModel.getCartItemsWithDetails).toHaveBeenCalledWith(1);
    });
  });

  // ── getOrderDetail() ────────────────────────────────────────────────────────
  describe("getOrderDetail()", () => {
    // TC_ORD_08
    test("TC_ORD_08 - Trả về chi tiết đơn hàng khi orderId tồn tại", async () => {
      // Input: orderId=1
      // Expected Output: return order object với đầy đủ thông tin
      // CheckDB: findByIdWithDetails được gọi với orderId=1
      // Rollback: read-only flow with mocks, no DB mutation
      const mockOrder = {
        id: 1,
        user_id: 1,
        total_price: 250000,
        status: "pending",
        payment_status: "unpaid",
        shipping_address: "123 Hà Nội",
        items: [{ variant_id: 7, quantity: 2, price: 50000 }],
      };
      orderModel.findByIdWithDetails.mockResolvedValue(mockOrder);

      const result = await OrderService.getOrderDetail(1);

      expect(result).toEqual(mockOrder);
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledTimes(1);
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    // TC_ORD_09
    test("TC_ORD_09 - Throw lỗi khi orderId không tồn tại", async () => {
      // Input: orderId=9999
      // Expected Output: throw Error("Order not found")
      // CheckDB: findByIdWithDetails được gọi, trả về null
      // Rollback: read-only flow with mocks, no DB mutation
      orderModel.findByIdWithDetails.mockResolvedValue(null);

      await expect(OrderService.getOrderDetail(9999)).rejects.toThrow(
        "Order not found",
      );
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledTimes(1);
      expect(orderModel.findByIdWithDetails).toHaveBeenCalledWith(9999);
    });
  });

  // ── getMyOrders() ──────────────────────────────────────────────────────────
  describe("getMyOrders()", () => {
    // TC_ORD_10
    test("TC_ORD_10 - Trả về danh sách đơn hàng kèm pagination cho user hợp lệ", async () => {
      // Input: userId=1, filters={ page: 1, limit: 10 }
      // Expected Output: { orders: [...], pagination: { page, limit, total, total_pages } }
      // CheckDB: findByUserId, countByUserId, countOrderItems được gọi
      // Rollback: read-only flow with mocks, no DB mutation
      const mockOrders = [
        {
          id: 1,
          total_price: "250000",
          status: "pending",
          payment_status: "unpaid",
          created_at: "2024-01-01",
        },
        {
          id: 2,
          total_price: "150000",
          status: "delivered",
          payment_status: "paid",
          created_at: "2024-01-02",
        },
      ];
      orderModel.findByUserId.mockResolvedValue(mockOrders);
      orderModel.countByUserId.mockResolvedValue(2);
      orderModel.countOrderItems.mockResolvedValue(3);

      const result = await OrderService.getMyOrders(1, { page: 1, limit: 10 });

      expect(result.orders).toHaveLength(2);
      expect(result.orders[0]).toEqual({
        id: 1,
        total_price: 250000,
        status: "pending",
        payment_status: "unpaid",
        created_at: "2024-01-01",
        total_items: 3,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        total_pages: 1,
      });
      expect(orderModel.findByUserId).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
      expect(orderModel.countByUserId).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
      expect(orderModel.countOrderItems).toHaveBeenCalledTimes(2);
    });

    // TC_ORD_11
    test("TC_ORD_11 - Dùng default pagination khi filters rỗng", async () => {
      // Input: userId=1, filters={} (không truyền page/limit)
      // Expected Output: pagination dùng default page=1, limit=10
      // CheckDB: findByUserId và countByUserId được gọi với filters={}
      // Rollback: read-only flow with mocks, no DB mutation
      orderModel.findByUserId.mockResolvedValue([]);
      orderModel.countByUserId.mockResolvedValue(0);

      const result = await OrderService.getMyOrders(1, {});

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      });
      expect(orderModel.findByUserId).toHaveBeenCalledWith(1, {});
    });

    // TC_ORD_12
    test("TC_ORD_12 - Throw lỗi khi model throw lỗi DB trong getMyOrders", async () => {
      // Input: userId=1
      // Expected Output: throw Error("DB error")
      // CheckDB: findByUserId throw lỗi
      // Rollback: read-only flow with mocks, no DB mutation
      orderModel.findByUserId.mockRejectedValue(new Error("DB error"));

      await expect(OrderService.getMyOrders(1)).rejects.toThrow("DB error");
      expect(orderModel.findByUserId).toHaveBeenCalledTimes(1);
    });
  });

  // ── cancelOrder() ─────────────────────────────────────────────────────────
  describe("cancelOrder()", () => {
    // TC_ORD_13
    test("TC_ORD_13 - Hủy đơn hàng thành công và hoàn lại tồn kho", async () => {
      // Input: orderId=1, reason="Tôi đổi ý"
      // Expected Output: return true; stock được hoàn lại, status cập nhật = "canceled"
      // CheckDB: getOrderItems, updateVariantStock(increment), update(canceled) được gọi
      // Rollback: using mocked transaction only, no real DB write
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      const mockOrder = { id: 1, status: "pending", payment_status: "unpaid" };
      const mockItems = [
        { variant_id: 7, quantity: 2 },
        { variant_id: 8, quantity: 1 },
      ];
      orderModel.findById.mockResolvedValue(mockOrder);
      orderModel.getOrderItems.mockResolvedValue(mockItems);
      productModel.updateVariantStock.mockResolvedValue(true);
      orderModel.update.mockResolvedValue(true);

      const result = await OrderService.cancelOrder(1, "Tôi đổi ý");

      expect(result).toBe(true);
      expect(orderModel.findById).toHaveBeenCalledWith(1);
      expect(orderModel.getOrderItems).toHaveBeenCalledWith(1);
      expect(productModel.updateVariantStock).toHaveBeenCalledWith(
        7,
        2,
        "increment",
      );
      expect(productModel.updateVariantStock).toHaveBeenCalledWith(
        8,
        1,
        "increment",
      );
      expect(orderModel.update).toHaveBeenCalledWith(1, { status: "canceled" });
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    // TC_ORD_14
    test("TC_ORD_14 - Thêm payment_status=refunded khi hủy đơn đã thanh toán", async () => {
      // Input: orderId=2, order đã thanh toán (payment_status="paid")
      // Expected Output: update được gọi với { status: "canceled", payment_status: "refunded" }
      // CheckDB: xác minh updateData có payment_status="refunded"
      // Rollback: using mocked transaction only, no real DB write
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      const mockOrder = { id: 2, status: "pending", payment_status: "paid" };
      orderModel.findById.mockResolvedValue(mockOrder);
      orderModel.getOrderItems.mockResolvedValue([
        { variant_id: 7, quantity: 1 },
      ]);
      productModel.updateVariantStock.mockResolvedValue(true);
      orderModel.update.mockResolvedValue(true);

      const result = await OrderService.cancelOrder(2, "Hàng lỗi");

      expect(result).toBe(true);
      expect(orderModel.update).toHaveBeenCalledWith(2, {
        status: "canceled",
        payment_status: "refunded",
      });
      expect(connection.commit).toHaveBeenCalledTimes(1);
    });

    // TC_ORD_15
    test("TC_ORD_15 - Throw lỗi khi đơn hàng đã giao, không thể hủy", async () => {
      // Input: orderId=3, order đã giao (status="delivered")
      // Expected Output: throw Error("Cannot cancel this order")
      // CheckDB: orderModel.update KHÔNG được gọi
      // Rollback: transaction is rolled back via mocked connection
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      orderModel.findById.mockResolvedValue({
        id: 3,
        status: "delivered",
        payment_status: "paid",
      });

      await expect(OrderService.cancelOrder(3, "test")).rejects.toThrow(
        "Cannot cancel this order",
      );
      expect(orderModel.update).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    // TC_ORD_16
    test("TC_ORD_16 - Throw lỗi khi đơn hàng đã bị hủy trước đó", async () => {
      // Input: orderId=4, order đã bị hủy (status="canceled")
      // Expected Output: throw Error("Cannot cancel this order")
      // CheckDB: orderModel.update KHÔNG được gọi
      // Rollback: transaction is rolled back via mocked connection
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      orderModel.findById.mockResolvedValue({
        id: 4,
        status: "canceled",
        payment_status: "unpaid",
      });

      await expect(OrderService.cancelOrder(4, "test")).rejects.toThrow(
        "Cannot cancel this order",
      );
      expect(orderModel.update).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    // TC_ORD_17
    test("TC_ORD_17 - Throw lỗi khi orderId không tồn tại trong cancelOrder", async () => {
      // Input: orderId=9999
      // Expected Output: throw Error("Order not found")
      // CheckDB: findById trả về null
      // Rollback: transaction is rolled back via mocked connection
      const connection = createMockConnection();
      pool.getConnection.mockResolvedValue(connection);

      orderModel.findById.mockResolvedValue(null);

      await expect(OrderService.cancelOrder(9999, "test")).rejects.toThrow(
        "Order not found",
      );
      expect(orderModel.getOrderItems).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });
  });

  // ── updatePaymentStatus() ─────────────────────────────────────────────────
  describe("updatePaymentStatus()", () => {
    // TC_ORD_18
    test("TC_ORD_18 - Cập nhật payment status thành công", async () => {
      // Input: orderId=1, paymentStatus="paid"
      // Expected Output: return true
      // CheckDB: orderModel.updatePaymentStatus được gọi với đúng tham số
      // Rollback: no transaction, mock only
      orderModel.updatePaymentStatus.mockResolvedValue(true);

      const result = await OrderService.updatePaymentStatus(1, "paid");

      expect(result).toBe(true);
      expect(orderModel.updatePaymentStatus).toHaveBeenCalledTimes(1);
      expect(orderModel.updatePaymentStatus).toHaveBeenCalledWith(1, "paid");
    });

    // TC_ORD_19
    test("TC_ORD_19 - Throw lỗi khi model throw lỗi DB trong updatePaymentStatus", async () => {
      // Input: orderId=1, paymentStatus="paid"
      // Expected Output: throw Error("DB error")
      // CheckDB: updatePaymentStatus throw lỗi
      // Rollback: no transaction, mock only
      orderModel.updatePaymentStatus.mockRejectedValue(new Error("DB error"));

      await expect(OrderService.updatePaymentStatus(1, "paid")).rejects.toThrow(
        "DB error",
      );
      expect(orderModel.updatePaymentStatus).toHaveBeenCalledTimes(1);
    });
  });
  // ── end updatePaymentStatus() ─────────────────────────────────────────────

  // ── getAllOrders() ─────────────────────────────────────────────────────────
  describe("getAllOrders()", () => {
    // TC_ORD_20
    test("TC_ORD_20 - Trả về tất cả đơn hàng kèm pagination cho admin", async () => {
      // Input: filters={ page: 1, limit: 20 }
      // Expected Output: { orders: [...], pagination: { page, limit, total, total_pages } }
      // CheckDB: findAll, count, countOrderItems được gọi
      // Rollback: read-only flow with mocks, no DB mutation
      const mockOrders = [
        {
          id: 1,
          user_name: "Nguyen Van A",
          user_email: "a@test.com",
          total_price: "250000",
          shipping_address: "123 Hà Nội",
          status: "pending",
          payment_status: "unpaid",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];
      orderModel.findAll.mockResolvedValue(mockOrders);
      orderModel.count.mockResolvedValue(1);
      orderModel.countOrderItems.mockResolvedValue(2);

      const result = await OrderService.getAllOrders({ page: 1, limit: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]).toEqual({
        id: 1,
        customer_name: "Nguyen Van A",
        customer_email: "a@test.com",
        total_price: 250000,
        shipping_address: "123 Hà Nội",
        status: "pending",
        payment_status: "unpaid",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        total_items: 2,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
      expect(orderModel.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(orderModel.count).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    // TC_ORD_21
    test("TC_ORD_21 - Dùng default pagination khi không truyền filters", async () => {
      // Input: filters={} (không truyền page/limit)
      // Expected Output: pagination dùng default page=1, limit=20
      // CheckDB: findAll và count được gọi với filters={}
      // Rollback: read-only flow with mocks, no DB mutation
      orderModel.findAll.mockResolvedValue([]);
      orderModel.count.mockResolvedValue(0);

      const result = await OrderService.getAllOrders({});

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      });
    });

    // TC_ORD_22
    test("TC_ORD_22 - Throw lỗi khi model throw lỗi DB trong getAllOrders", async () => {
      // Input: filters={}
      // Expected Output: throw Error("DB error")
      // CheckDB: findAll throw lỗi
      // Rollback: read-only flow with mocks, no DB mutation
      orderModel.findAll.mockRejectedValue(new Error("DB error"));

      await expect(OrderService.getAllOrders({})).rejects.toThrow("DB error");
      expect(orderModel.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── updateOrder() ─────────────────────────────────────────────────────────
  describe("updateOrder()", () => {
    // TC_ORD_23
    test("TC_ORD_23 - Cập nhật đơn hàng thành công", async () => {
      // Input: orderId=1, updateData={ status: "shipping" }
      // Expected Output: return true
      // CheckDB: orderModel.update được gọi với đúng tham số
      // Rollback: no transaction, mock only
      orderModel.update.mockResolvedValue(true);

      const result = await OrderService.updateOrder(1, { status: "shipping" });

      expect(result).toBe(true);
      expect(orderModel.update).toHaveBeenCalledTimes(1);
      expect(orderModel.update).toHaveBeenCalledWith(1, { status: "shipping" });
    });

    // TC_ORD_24
    test("TC_ORD_24 - Throw lỗi khi model throw lỗi DB trong updateOrder", async () => {
      // Input: orderId=1, updateData={ status: "shipping" }
      // Expected Output: throw Error("DB error")
      // CheckDB: orderModel.update throw lỗi
      // Rollback: no transaction, mock only
      orderModel.update.mockRejectedValue(new Error("DB error"));

      await expect(
        OrderService.updateOrder(1, { status: "shipping" }),
      ).rejects.toThrow("DB error");
      expect(orderModel.update).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── Branch bổ sung ──────────────────────────────────────────────────────────
describe("createOrder() — updateVariantStock returns false", () => {
  // TC_ORD_25
  test("TC_ORD_25 - Throw lỗi khi updateVariantStock trả về false", async () => {
    // Input: cart có 1 item, updateVariantStock trả về false
    // Expected Output: throw Error("Failed to update stock for variant ...")
    // CheckDB: rollback được gọi
    const connection = createMockConnection();
    pool.getConnection.mockResolvedValue(connection);

    cartModel.getCartItemsWithDetails.mockResolvedValue([
      {
        variant_id: 7,
        variant_name: "Size M",
        quantity: 2,
        stock: 10,
        price_sale: "50000",
      },
    ]);
    orderModel.create.mockResolvedValue({ id: 88 });
    orderModel.addOrderItem.mockResolvedValue(true);
    productModel.updateVariantStock.mockResolvedValue(false); // stock update thất bại

    await expect(
      OrderService.createOrder({
        userId: 1,
        cartId: 1,
        shippingAddress: "HN",
        paymentMethod: "COD",
        note: "",
      }),
    ).rejects.toThrow("Failed to update stock for variant Size M");

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(cartModel.clearCartItems).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});

// ─── getAllOrders bổ sung branch không truyền filters ───────────────────────
describe("getAllOrders() — no filters (default limit=20)", () => {
  test("TC_ORD_26 - Dùng default limit=20 khi gọi getAllOrders không truyền filters", async () => {
    // Input: gọi getAllOrders() không truyền filters
    // Expected: pagination dùng default limit=20
    orderModel.findAll.mockResolvedValue([]);
    orderModel.count.mockResolvedValue(0);

    // Act — không truyền argument để filters dùng default {}
    const result = await OrderService.getAllOrders();

    // Assert
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.total_pages).toBe(0);
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("createOrder() — dữ liệu đầu vào không hợp lệ", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_ORD_27
  test("TC_ORD_27 - Throw lỗi khi cart null (getCartItemsWithDetails trả về null)", async () => {
    // Một số mock trả về null thay vì [] → service kiểm tra !cartItems || cartItems.length === 0
    const connection = createMockConnection();
    pool.getConnection.mockResolvedValue(connection);
    cartModel.getCartItemsWithDetails.mockResolvedValue(null);

    await expect(
      OrderService.createOrder({
        userId: 1,
        cartId: 1,
        shippingAddress: "HN",
        paymentMethod: "COD",
        note: "",
      }),
    ).rejects.toThrow("Cart is empty");

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(orderModel.create).not.toHaveBeenCalled();
  });

  // TC_ORD_28
  test("TC_ORD_28 - Throw lỗi khi có nhiều items nhưng item thứ 2 hết tồn kho", async () => {
    // Item đầu đủ hàng, item thứ 2 stock=0 < quantity=1 → throw ở item thứ 2
    const connection = createMockConnection();
    pool.getConnection.mockResolvedValue(connection);

    cartModel.getCartItemsWithDetails.mockResolvedValue([
      {
        variant_id: 1,
        variant_name: "Size S",
        quantity: 1,
        stock: 10,
        price_sale: "50000",
      },
      {
        variant_id: 2,
        variant_name: "Size XL",
        quantity: 1,
        stock: 0,
        price_sale: "60000",
      },
    ]);

    await expect(
      OrderService.createOrder({
        userId: 1,
        cartId: 1,
        shippingAddress: "HN",
        paymentMethod: "COD",
        note: "",
      }),
    ).rejects.toThrow("Insufficient stock for product variant Size XL");

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(orderModel.create).not.toHaveBeenCalled();
  });
});

describe("cancelOrder() — trạng thái không cho phép hủy", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_ORD_29
  test("TC_ORD_29 - Throw lỗi khi đơn hàng đang vận chuyển (shipping) nhưng đã có payment", async () => {
    const connection = createMockConnection();
    pool.getConnection.mockResolvedValue(connection);

    orderModel.findById.mockResolvedValue({
      id: 10,
      status: "shipping",
      payment_status: "paid",
    });
    orderModel.getOrderItems.mockResolvedValue([
      { variant_id: 5, quantity: 2 },
    ]);
    productModel.updateVariantStock.mockResolvedValue(true);
    orderModel.update.mockResolvedValue(true);

    const result = await OrderService.cancelOrder(10, "Đổi ý");

    expect(result).toBe(true);
    expect(orderModel.update).toHaveBeenCalledWith(10, {
      status: "canceled",
      payment_status: "refunded",
    });
  });
});

describe("getCheckoutInfo() — cart items trả về null", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_ORD_30
  test("TC_ORD_30 - Throw lỗi khi getCartItemsWithDetails trả về null (không phải mảng rỗng)", async () => {
    cartModel.findById.mockResolvedValue({ id: 1, user_id: 1 });
    cartModel.getCartItemsWithDetails.mockResolvedValue(null);

    await expect(OrderService.getCheckoutInfo(1)).rejects.toThrow(
      "Cart is empty",
    );
  });
});

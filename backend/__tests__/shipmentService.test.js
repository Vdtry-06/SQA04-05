/**
 * Unit Test — ShipmentService
 * File gốc  : backend/services/shipmentService.js
 * Test file : backend/__tests__/shipmentService.test.js
 * Người PT  : Trịnh Quang Lâm
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock ShipmentModel,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

// ── Mock toàn bộ ShipmentModel — không dùng DB thật ─────────────────────────
jest.mock("../models/shipmentModel");

const ShipmentModel = require("../models/shipmentModel");
const ShipmentService = require("../services/shipmentService");

describe("ShipmentService", () => {
  // Reset tất cả mock trước mỗi test để tránh ảnh hưởng lẫn nhau
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  // ── getShipment() ──────────────────────────────────────────────────────────
  describe("getShipment()", () => {
    // TC_SHIP_01
    test("TC_SHIP_01 — Trả về shipment object khi orderId tồn tại", async () => {
      // Arrange — mock dữ liệu trả về khi tìm thấy shipment
      const mockShipment = {
        order_id: 1,
        status: "shipping",
        tracking_code: "VN123",
      };
      ShipmentModel.findByOrderId.mockResolvedValue(mockShipment);

      // Act — gọi hàm cần test
      const result = await ShipmentService.getShipment(1);

      // Assert — kiểm tra kết quả trả về đúng object
      expect(result).toEqual(mockShipment);
      expect(result).toHaveProperty("order_id", 1);
      expect(result).toHaveProperty("status", "shipping");
      expect(result).toHaveProperty("tracking_code", "VN123");

      // CheckDB — xác minh findByOrderId được gọi đúng 1 lần với đúng tham số
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledWith(1);
    });

    // TC_SHIP_02
    test("TC_SHIP_02 — Trả về null khi orderId không có shipment", async () => {
      // Arrange — mock trả về null (không tìm thấy shipment)
      ShipmentModel.findByOrderId.mockResolvedValue(null);

      // Act
      const result = await ShipmentService.getShipment(9999);

      // Assert — kết quả phải là null
      expect(result).toBeNull();

      // CheckDB — xác minh vẫn gọi đúng hàm với đúng tham số
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledWith(9999);
    });
  });

  // ── updateShipment() ───────────────────────────────────────────────────────
  describe("updateShipment()", () => {
    // TC_SHIP_03
    test("TC_SHIP_03 — Gọi create() để tạo shipment mới khi chưa có shipment cho order này", async () => {
      // Arrange — mock findByOrderId trả về null => chưa có shipment
      const newShipment = {
        order_id: 1,
        status: "shipping",
        tracking_code: "VN123",
      };
      ShipmentModel.findByOrderId.mockResolvedValue(null);
      ShipmentModel.create.mockResolvedValue(newShipment);

      const shipmentData = { status: "shipping", tracking_code: "VN123" };

      // Act
      const result = await ShipmentService.updateShipment(1, shipmentData);

      // Assert — kết quả là shipment vừa được tạo
      expect(result).toEqual(newShipment);

      // CheckDB — create() phải được gọi đúng 1 lần với đúng data
      expect(ShipmentModel.create).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.create).toHaveBeenCalledWith({
        order_id: 1,
        ...shipmentData,
      });

      // CheckDB — update() KHÔNG được gọi vì shipment chưa tồn tại
      expect(ShipmentModel.update).not.toHaveBeenCalled();
    });

    // TC_SHIP_04
    test("TC_SHIP_04 — Gọi update() để cập nhật shipment hiện có khi đã tồn tại cho order", async () => {
      // Arrange — mock findByOrderId trả về object => đã có shipment
      const existingShipment = {
        order_id: 1,
        status: "shipping",
        tracking_code: "VN123",
      };
      const updatedShipment = {
        order_id: 1,
        status: "delivered",
        tracking_code: "VN123",
      };
      ShipmentModel.findByOrderId.mockResolvedValue(existingShipment);
      ShipmentModel.update.mockResolvedValue(updatedShipment);

      const shipmentData = { status: "delivered" };

      // Act
      const result = await ShipmentService.updateShipment(1, shipmentData);

      // Assert — kết quả là shipment sau khi cập nhật
      expect(result).toEqual(updatedShipment);
      expect(result).toHaveProperty("status", "delivered");

      // CheckDB — update() phải được gọi đúng 1 lần với đúng tham số
      expect(ShipmentModel.update).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.update).toHaveBeenCalledWith(1, shipmentData);

      // CheckDB — create() KHÔNG được gọi vì shipment đã tồn tại
      expect(ShipmentModel.create).not.toHaveBeenCalled();
    });

    // TC_SHIP_05
    test("TC_SHIP_05 — Throw lỗi khi model throw lỗi DB trong updateShipment", async () => {
      // Arrange — mock findByOrderId throw lỗi DB
      ShipmentModel.findByOrderId.mockRejectedValue(
        new Error("DB connection failed"),
      );

      // Act & Assert — lỗi phải được re-throw ra ngoài
      await expect(
        ShipmentService.updateShipment(1, { status: "shipping" }),
      ).rejects.toThrow("DB connection failed");

      // CheckDB — findByOrderId vẫn được gọi
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledWith(1);
    });
  });

  // ── getShipment() error branch ─────────────────────────────────────────────
  describe("getShipment() — error branch", () => {
    // TC_SHIP_06
    test("TC_SHIP_06 — Throw lỗi khi model throw lỗi DB trong getShipment", async () => {
      // Arrange — mock findByOrderId throw lỗi DB
      ShipmentModel.findByOrderId.mockRejectedValue(new Error("Timeout"));

      // Act & Assert — lỗi phải được re-throw ra ngoài
      await expect(ShipmentService.getShipment(1)).rejects.toThrow("Timeout");

      // CheckDB — xác minh vẫn gọi đúng hàm
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findByOrderId).toHaveBeenCalledWith(1);
    });
  });

  // ── getAllShipments() ──────────────────────────────────────────────────────
  describe("getAllShipments()", () => {
    // TC_SHIP_07
    test("TC_SHIP_07 — Trả về danh sách tất cả shipments theo filters", async () => {
      // Arrange — mock trả về danh sách 2 shipment
      const mockList = [
        { order_id: 1, status: "shipping", tracking_code: "VN001" },
        { order_id: 2, status: "delivered", tracking_code: "VN002" },
      ];
      ShipmentModel.findAll.mockResolvedValue(mockList);

      const filters = { status: "shipping" };

      // Act
      const result = await ShipmentService.getAllShipments(filters);

      // Assert — trả về đúng danh sách
      expect(result).toEqual(mockList);
      expect(result).toHaveLength(2);

      // CheckDB — xác minh findAll được gọi đúng 1 lần với đúng filters
      expect(ShipmentModel.findAll).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findAll).toHaveBeenCalledWith(filters);
    });

    // TC_SHIP_08
    test("TC_SHIP_08 — Trả về mảng rỗng khi không có shipment nào", async () => {
      // Arrange — mock trả về array rỗng
      ShipmentModel.findAll.mockResolvedValue([]);

      // Act
      const result = await ShipmentService.getAllShipments({});

      // Assert — trả về array rỗng
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);

      // CheckDB
      expect(ShipmentModel.findAll).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findAll).toHaveBeenCalledWith({});
    });

    // TC_SHIP_09
    test("TC_SHIP_09 — Dùng {} làm default filters khi không truyền argument", async () => {
      // Arrange — gọi không truyền filters, mong model nhận {}
      ShipmentModel.findAll.mockResolvedValue([]);

      // Act
      await ShipmentService.getAllShipments();

      // CheckDB — xác minh findAll được gọi với {} (default)
      expect(ShipmentModel.findAll).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.findAll).toHaveBeenCalledWith({});
    });

    // TC_SHIP_10
    test("TC_SHIP_10 — Throw lỗi khi model throw lỗi DB trong getAllShipments", async () => {
      // Arrange — mock throw lỗi DB
      ShipmentModel.findAll.mockRejectedValue(new Error("Table not found"));

      // Act & Assert — lỗi phải được re-throw ra ngoài
      await expect(ShipmentService.getAllShipments({})).rejects.toThrow(
        "Table not found",
      );

      // CheckDB
      expect(ShipmentModel.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── deleteShipment() ──────────────────────────────────────────────────────
  describe("deleteShipment()", () => {
    // TC_SHIP_11
    test("TC_SHIP_11 — Trả về kết quả xóa thành công khi orderId tồn tại", async () => {
      // Arrange — mock trả về { affectedRows: 1 } (xóa thành công)
      ShipmentModel.delete.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await ShipmentService.deleteShipment(1);

      // Assert — trả về kết quả từ model
      expect(result).toEqual({ affectedRows: 1 });

      // CheckDB — xác minh delete được gọi đúng 1 lần với đúng tham số
      expect(ShipmentModel.delete).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.delete).toHaveBeenCalledWith(1);
    });

    // TC_SHIP_12
    test("TC_SHIP_12 — Trả về affectedRows=0 khi orderId không tồn tại", async () => {
      // Arrange — mock trả về affectedRows=0 (không tìm thấy record)
      ShipmentModel.delete.mockResolvedValue({ affectedRows: 0 });

      // Act
      const result = await ShipmentService.deleteShipment(9999);

      // Assert — trả về kết quả từ model (service không throw, chỉ pass-through)
      expect(result).toEqual({ affectedRows: 0 });

      // CheckDB
      expect(ShipmentModel.delete).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.delete).toHaveBeenCalledWith(9999);
    });

    // TC_SHIP_13
    test("TC_SHIP_13 — Throw lỗi khi model throw lỗi DB trong deleteShipment", async () => {
      // Arrange — mock throw lỗi DB
      ShipmentModel.delete.mockRejectedValue(
        new Error("Foreign key constraint"),
      );

      // Act & Assert — lỗi phải được re-throw ra ngoài
      await expect(ShipmentService.deleteShipment(1)).rejects.toThrow(
        "Foreign key constraint",
      );

      // CheckDB
      expect(ShipmentModel.delete).toHaveBeenCalledTimes(1);
      expect(ShipmentModel.delete).toHaveBeenCalledWith(1);
    });
  });
});

// ── Negative test cases bổ sung ───────────────────────────────────────────────
describe("updateShipment() — shipmentData không hợp lệ", () => {
  // TC_SHIP_14
  test("TC_SHIP_14 — Tạo shipment mới khi shipmentData là object rỗng (service không validate data)", async () => {
    // Service không kiểm tra shipmentData có hợp lệ không → gọi create với data rỗng
    ShipmentModel.findByOrderId.mockResolvedValue(null);
    ShipmentModel.create.mockResolvedValue({ order_id: 1 });

    const result = await ShipmentService.updateShipment(1, {}); // data rỗng

    // Service KHÔNG chặn data rỗng → lỗ hổng
    expect(ShipmentModel.create).toHaveBeenCalledWith({ order_id: 1 });
    expect(result).toEqual({ order_id: 1 });
  });
});

describe("getShipment() — orderId không hợp lệ", () => {
  // TC_SHIP_15
  test("TC_SHIP_15 — Trả về null khi orderId là string không phải số (service không validate kiểu)", async () => {
    // Service không validate kiểu orderId → gọi findByOrderId với string
    ShipmentModel.findByOrderId.mockResolvedValue(null);

    const result = await ShipmentService.getShipment("abc");

    // Service KHÔNG chặn orderId không phải số
    expect(result).toBeNull();
    expect(ShipmentModel.findByOrderId).toHaveBeenCalledWith("abc");
  });
});

// ── test service thiếu validation ─────────────────
describe("updateShipment() — service phải validate shipmentData không rỗng", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_SHIP_16
  test("TC_SHIP_16 — Phải throw lỗi khi shipmentData là object rỗng {}", async () => {
    // Nghiệp vụ: cập nhật shipment với data rỗng là vô nghĩa
    // Hiện tại: service tạo/update với data rỗng → lỗ hổng
    // Cần sửa: thêm if (!shipmentData || Object.keys(shipmentData).length === 0) throw error
    await expect(ShipmentService.updateShipment(1, {})).rejects.toThrow(
      "Shipment data cannot be empty",
    );

    expect(ShipmentModel.findByOrderId).not.toHaveBeenCalled();
  });
});

describe("getShipment() — service phải validate orderId là số hợp lệ", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_SHIP_17
  test("TC_SHIP_17 — Phải throw lỗi khi orderId là chuỗi không phải số ('abc')", async () => {
    // Nghiệp vụ: orderId phải là số nguyên dương
    // Hiện tại: service không validate kiểu → query DB với 'abc'
    // Cần sửa: thêm if (isNaN(orderId) || orderId <= 0) throw error
    await expect(ShipmentService.getShipment("abc")).rejects.toThrow(
      "Invalid orderId",
    );

    expect(ShipmentModel.findByOrderId).not.toHaveBeenCalled();
  });
});

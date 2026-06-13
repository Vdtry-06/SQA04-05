/**
 * Unit Test — contactService
 * File gốc  : backend/services/contactService.js
 * Test file : backend/__tests__/contactService.test.js
 * Người PT  : Vũ Nhân Kiên
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock contactModel,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

// ── Mock toàn bộ contactModel — không dùng DB thật ──────────────────────────
jest.mock("../models/contactModel");

const contactModel = require("../models/contactModel");
const contactService = require("../services/contactService");

describe("contactService", () => {
  // Reset tất cả mock trước mỗi test để tránh ảnh hưởng lẫn nhau
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── updateStatus() ─────────────────────────────────────────────────────────
  describe("updateStatus()", () => {
    // TC_CONT_01
    test("TC_CONT_01 — Trả về success:false khi status không hợp lệ", async () => {
      // Arrange — không cần mock model vì validation chặn trước khi gọi DB

      // Act
      const result = await contactService.updateStatus(1, "invalid_status");

      // Assert — trả về lỗi validation
      expect(result).toEqual({
        success: false,
        message: "Status không hợp lệ",
      });

      // CheckDB — contactModel.updateStatus KHÔNG được gọi vì bị chặn bởi validation
      expect(contactModel.updateStatus).not.toHaveBeenCalled();
    });

    // TC_CONT_02
    test("TC_CONT_02 — Cập nhật status thành công khi status hợp lệ và record tồn tại", async () => {
      // Arrange — mock trả về affectedRows=1 (update thành công)
      contactModel.updateStatus.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await contactService.updateStatus(1, "resolved");

      // Assert — trả về thành công
      expect(result).toEqual({
        success: true,
        message: "Cập nhật thành công",
      });

      // CheckDB — xác minh updateStatus được gọi đúng 1 lần với đúng tham số
      expect(contactModel.updateStatus).toHaveBeenCalledTimes(1);
      expect(contactModel.updateStatus).toHaveBeenCalledWith(1, "resolved");
    });

    // TC_CONT_03
    test("TC_CONT_03 — Trả về success:false khi id không tồn tại (affectedRows=0) trong updateStatus", async () => {
      // Arrange — mock trả về affectedRows=0 (không tìm thấy record)
      contactModel.updateStatus.mockResolvedValue({ affectedRows: 0 });

      // Act
      const result = await contactService.updateStatus(9999, "pending");

      // Assert — trả về không tìm thấy
      expect(result).toEqual({
        success: false,
        message: "Không tìm thấy",
      });

      // CheckDB — xác minh updateStatus vẫn được gọi với đúng tham số
      expect(contactModel.updateStatus).toHaveBeenCalledTimes(1);
      expect(contactModel.updateStatus).toHaveBeenCalledWith(9999, "pending");
    });
  });

  // ── getRequestById() ───────────────────────────────────────────────────────
  describe("getRequestById()", () => {
    // TC_CONT_04
    test("TC_CONT_04 — Trả về success:true kèm data khi id tồn tại", async () => {
      // Arrange — mock trả về array có 1 phần tử (tìm thấy record)
      const mockContact = {
        id: 1,
        name: "Nguyen Van A",
        email: "a@test.com",
        status: "pending",
      };
      contactModel.getById.mockResolvedValue([mockContact]);

      // Act
      const result = await contactService.getRequestById(1);

      // Assert — trả về đúng object trong data
      expect(result).toEqual({
        success: true,
        data: mockContact,
      });
      expect(result.data).toHaveProperty("id", 1);

      // CheckDB — xác minh getById được gọi đúng 1 lần với đúng tham số
      expect(contactModel.getById).toHaveBeenCalledTimes(1);
      expect(contactModel.getById).toHaveBeenCalledWith(1);
    });

    // TC_CONT_05
    test("TC_CONT_05 — Trả về success:false khi id không tồn tại trong getRequestById", async () => {
      // Arrange — mock trả về array rỗng (không tìm thấy record)
      contactModel.getById.mockResolvedValue([]);

      // Act
      const result = await contactService.getRequestById(9999);

      // Assert — trả về không tìm thấy
      expect(result).toEqual({
        success: false,
        message: "Không tìm thấy",
      });

      // CheckDB — xác minh getById vẫn được gọi với đúng tham số
      expect(contactModel.getById).toHaveBeenCalledTimes(1);
      expect(contactModel.getById).toHaveBeenCalledWith(9999);
    });

    // TC_CONT_06
    test("TC_CONT_06 — Trả về success:false khi model throw lỗi DB trong getRequestById", async () => {
      // Arrange — mock throw lỗi DB
      contactModel.getById.mockRejectedValue(new Error("DB connection failed"));

      // Act
      const result = await contactService.getRequestById(1);

      // Assert — trả về lỗi từ catch block
      expect(result).toEqual({
        success: false,
        message: "Lỗi lấy chi tiết",
        error: "DB connection failed",
      });

      // CheckDB — xác minh getById vẫn được gọi
      expect(contactModel.getById).toHaveBeenCalledTimes(1);
      expect(contactModel.getById).toHaveBeenCalledWith(1);
    });
  });

  // ── updateStatus() error branch ────────────────────────────────────────────
  describe("updateStatus() — error branch", () => {
    // TC_CONT_07
    test("TC_CONT_07 — Trả về success:false khi model throw lỗi DB trong updateStatus", async () => {
      // Arrange — mock throw lỗi DB
      contactModel.updateStatus.mockRejectedValue(new Error("Timeout"));

      // Act
      const result = await contactService.updateStatus(1, "pending");

      // Assert — trả về lỗi từ catch block
      expect(result).toEqual({
        success: false,
        message: "Lỗi cập nhật",
        error: "Timeout",
      });

      // CheckDB — xác minh updateStatus vẫn được gọi
      expect(contactModel.updateStatus).toHaveBeenCalledTimes(1);
      expect(contactModel.updateStatus).toHaveBeenCalledWith(1, "pending");
    });
  });

  // ── createRequest() ────────────────────────────────────────────────────────
  describe("createRequest()", () => {
    // TC_CONT_08
    test("TC_CONT_08 — Tạo contact request thành công, trả về insertId", async () => {
      // Arrange — mock trả về insertId=5 (tạo record thành công)
      contactModel.create.mockResolvedValue({ insertId: 5 });

      const data = {
        name: "Nguyen Van B",
        email: "b@test.com",
        message: "Tôi cần hỗ trợ",
      };

      // Act
      const result = await contactService.createRequest(data);

      // Assert — trả về thành công kèm id mới
      expect(result).toEqual({
        success: true,
        message: "Gửi liên hệ thành công. Cảm ơn bạn!",
        data: { id: 5 },
      });

      // CheckDB — xác minh create được gọi đúng 1 lần với đúng data
      expect(contactModel.create).toHaveBeenCalledTimes(1);
      expect(contactModel.create).toHaveBeenCalledWith(data);
    });

    // TC_CONT_09
    test("TC_CONT_09 — Trả về success:false khi model throw lỗi DB trong createRequest", async () => {
      // Arrange — mock throw lỗi DB
      contactModel.create.mockRejectedValue(new Error("Duplicate entry"));

      const data = { name: "X", email: "x@test.com", message: "test" };

      // Act
      const result = await contactService.createRequest(data);

      // Assert — trả về lỗi từ catch block
      expect(result).toEqual({
        success: false,
        message: "Lỗi gửi liên hệ",
        error: "Duplicate entry",
      });

      // CheckDB — xác minh create vẫn được gọi
      expect(contactModel.create).toHaveBeenCalledTimes(1);
      expect(contactModel.create).toHaveBeenCalledWith(data);
    });
  });

  // ── getAllRequests() ────────────────────────────────────────────────────────
  describe("getAllRequests()", () => {
    // TC_CONT_10
    test("TC_CONT_10 — Trả về success:true kèm danh sách contacts", async () => {
      // Arrange — mock trả về danh sách 2 contact
      const mockList = [
        { id: 1, name: "Nguyen Van A", email: "a@test.com", status: "pending" },
        { id: 2, name: "Tran Thi B", email: "b@test.com", status: "resolved" },
      ];
      contactModel.getAll.mockResolvedValue(mockList);

      // Act
      const result = await contactService.getAllRequests();

      // Assert — trả về thành công kèm data
      expect(result).toEqual({
        success: true,
        data: mockList,
      });
      expect(result.data).toHaveLength(2);

      // CheckDB — xác minh getAll được gọi đúng 1 lần, không tham số
      expect(contactModel.getAll).toHaveBeenCalledTimes(1);
    });

    // TC_CONT_11
    test("TC_CONT_11 — Trả về success:true với data rỗng khi không có contact nào", async () => {
      // Arrange — mock trả về array rỗng
      contactModel.getAll.mockResolvedValue([]);

      // Act
      const result = await contactService.getAllRequests();

      // Assert — vẫn success nhưng data rỗng
      expect(result).toEqual({
        success: true,
        data: [],
      });
      expect(result.data).toHaveLength(0);

      // CheckDB
      expect(contactModel.getAll).toHaveBeenCalledTimes(1);
    });

    // TC_CONT_12
    test("TC_CONT_12 — Trả về success:false khi model throw lỗi DB trong getAllRequests", async () => {
      // Arrange — mock throw lỗi DB
      contactModel.getAll.mockRejectedValue(new Error("Table not found"));

      // Act
      const result = await contactService.getAllRequests();

      // Assert — trả về lỗi từ catch block
      expect(result).toEqual({
        success: false,
        message: "Lỗi lấy danh sách",
        error: "Table not found",
      });

      // CheckDB
      expect(contactModel.getAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── deleteRequest() ────────────────────────────────────────────────────────
  describe("deleteRequest()", () => {
    // TC_CONT_13
    test("TC_CONT_13 — Xóa contact request thành công", async () => {
      // Arrange — mock trả về affectedRows=1 (xóa thành công)
      contactModel.delete.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await contactService.deleteRequest(1);

      // Assert — trả về thành công
      expect(result).toEqual({
        success: true,
        message: "Xóa thành công",
      });

      // CheckDB — xác minh delete được gọi đúng 1 lần với đúng tham số
      expect(contactModel.delete).toHaveBeenCalledTimes(1);
      expect(contactModel.delete).toHaveBeenCalledWith(1);
    });

    // TC_CONT_14
    test("TC_CONT_14 — Trả về success:false khi id không tồn tại trong deleteRequest", async () => {
      // Arrange — mock trả về affectedRows=0 (không tìm thấy record)
      contactModel.delete.mockResolvedValue({ affectedRows: 0 });

      // Act
      const result = await contactService.deleteRequest(9999);

      // Assert — trả về không tìm thấy
      expect(result).toEqual({
        success: false,
        message: "Không tìm thấy",
      });

      // CheckDB
      expect(contactModel.delete).toHaveBeenCalledTimes(1);
      expect(contactModel.delete).toHaveBeenCalledWith(9999);
    });

    // TC_CONT_15
    test("TC_CONT_15 — Trả về success:false khi model throw lỗi DB trong deleteRequest", async () => {
      // Arrange — mock throw lỗi DB
      contactModel.delete.mockRejectedValue(
        new Error("Foreign key constraint"),
      );

      // Act
      const result = await contactService.deleteRequest(1);

      // Assert — trả về lỗi từ catch block
      expect(result).toEqual({
        success: false,
        message: "Lỗi xóa",
        error: "Foreign key constraint",
      });

      // CheckDB
      expect(contactModel.delete).toHaveBeenCalledTimes(1);
      expect(contactModel.delete).toHaveBeenCalledWith(1);
    });
  });
});

// ── Negative test cases bổ sung ───────────────────────────────────────────────
describe("updateStatus() — giá trị status không hợp lệ thêm", () => {
  // TC_CONT_16
  test("TC_CONT_16 — Trả về success:false khi status là null", async () => {
    // null không nằm trong ['pending', 'resolved'] → bị chặn validation
    const result = await contactService.updateStatus(1, null);

    expect(result).toEqual({
      success: false,
      message: "Status không hợp lệ",
    });
    expect(contactModel.updateStatus).not.toHaveBeenCalled();
  });

  // TC_CONT_17
  test("TC_CONT_17 — Trả về success:false khi status là chuỗi rỗng", async () => {
    // '' không nằm trong ['pending', 'resolved'] → bị chặn validation
    const result = await contactService.updateStatus(1, "");

    expect(result).toEqual({
      success: false,
      message: "Status không hợp lệ",
    });
    expect(contactModel.updateStatus).not.toHaveBeenCalled();
  });

  // TC_CONT_18
  test("TC_CONT_18 — Trả về success:false khi status viết hoa (PENDING) — service không normalize", async () => {
    // 'PENDING' !== 'pending' → không match → bị chặn
    const result = await contactService.updateStatus(1, "PENDING");

    expect(result).toEqual({
      success: false,
      message: "Status không hợp lệ",
    });
    expect(contactModel.updateStatus).not.toHaveBeenCalled();
  });
});

describe("getRequestById() — id không hợp lệ", () => {
  // TC_CONT_19
  test("TC_CONT_19 — Trả về success:false khi getById trả về null thay vì array rỗng", async () => {
    // Một số DB driver trả về null thay vì [] → service kiểm tra !results || results.length === 0
    contactModel.getById.mockResolvedValue(null);

    const result = await contactService.getRequestById(1);

    expect(result).toEqual({
      success: false,
      message: "Không tìm thấy",
    });
  });
});

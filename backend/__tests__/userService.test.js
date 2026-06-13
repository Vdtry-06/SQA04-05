/**
 * Unit Test — userService
 * File gốc  : backend/services/userService.js
 * Test file : backend/__tests__/userService.test.js
 * Người PT  : Vũ Thế Văn
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock userModel và bcrypt,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

jest.mock("../models/userModel");
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const userService = require("../services/userService");

describe("userService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("changePassword()", () => {
    test("TC_USER_01 - Hash và lưu password mới khi current password đúng", async () => {
      // Input: id=1, currentPassword="OldPass@1", newPassword="NewPass@1"
      // Expected Output: new password is hashed and saved; updatePassword is called; return update result
      // Mock: user exists, bcrypt.compare=true, bcrypt.hash returns hashed_new_password
      // CheckDB: verify model methods are called with correct parameters
      // Rollback: using Jest mocks only, so no real DB write happens
      userModel.findByIdWithPassword.mockResolvedValue({
        id: 1,
        password: "hashed_old_password",
      });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("hashed_new_password");
      const mockUpdateResult = { affectedRows: 1 };
      userModel.updatePassword.mockResolvedValue(mockUpdateResult);

      const result = await userService.changePassword(
        1,
        "OldPass@1",
        "NewPass@1",
      );

      expect(userModel.findByIdWithPassword).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "OldPass@1",
        "hashed_old_password",
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("NewPass@1", expect.any(Number));
      // CheckDB
      expect(userModel.updatePassword).toHaveBeenCalledWith(
        1,
        "hashed_new_password",
      );
      expect(result).toEqual(mockUpdateResult);
    });

    test("TC_USER_02 - Throw lỗi INCORRECT_PASSWORD khi current password sai", async () => {
      // Input: id=1, currentPassword="WrongPass", newPassword="NewPass@1"
      // Expected Output: throw Error with code="INCORRECT_PASSWORD"
      // Mock: bcrypt.compare=false; no DB update
      // CheckDB: updatePassword must not be called
      // Rollback: using Jest mocks only, so no real DB write happens
      userModel.findByIdWithPassword.mockResolvedValue({
        id: 1,
        password: "hashed_old_password",
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        userService.changePassword(1, "WrongPass", "NewPass@1"),
      ).rejects.toMatchObject({
        message: "Current password is incorrect",
        code: "INCORRECT_PASSWORD",
      });

      expect(userModel.findByIdWithPassword).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "WrongPass",
        "hashed_old_password",
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userModel.updatePassword).not.toHaveBeenCalled();
    });

    test("TC_USER_03 - Throw lỗi USER_NOT_FOUND khi user không tồn tại", async () => {
      // Input: id=999, currentPassword="any", newPassword="any"
      // Expected Output: throw Error with code="USER_NOT_FOUND"
      // Mock: userModel.findByIdWithPassword returns null
      // CheckDB: bcrypt and updatePassword must not be called
      // Rollback: using Jest mocks only, so no real DB write happens
      userModel.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        userService.changePassword(999, "any", "any"),
      ).rejects.toMatchObject({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });

      expect(userModel.findByIdWithPassword).toHaveBeenCalledWith(999);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userModel.updatePassword).not.toHaveBeenCalled();
    });
  });

  // ── getAllUsers() ──────────────────────────────────────────────────────────
  describe("getAllUsers()", () => {
    test("TC_USER_07 - Trả về danh sách tất cả users", async () => {
      // Input: không có tham số
      // Expected Output: trả về danh sách users từ model
      // CheckDB: userModel.findAll được gọi đúng 1 lần
      // Rollback: using Jest mocks only, no real DB read
      const mockUsers = [
        { id: 1, name: "Nguyen Van A", email: "a@test.com" },
        { id: 2, name: "Tran Thi B", email: "b@test.com" },
      ];
      userModel.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(userModel.findAll).toHaveBeenCalledTimes(1);
    });

    test("TC_USER_08 - Trả về mảng rỗng khi không có user nào", async () => {
      // Input: không có tham số
      // Expected Output: trả về mảng rỗng
      // CheckDB: userModel.findAll được gọi đúng 1 lần
      // Rollback: using Jest mocks only, no real DB read
      userModel.findAll.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(result).toEqual([]);
      expect(userModel.findAll).toHaveBeenCalledTimes(1);
    });

    test("TC_USER_09 - Throw lỗi khi model.findAll throw lỗi DB", async () => {
      // Input: không có tham số
      // Expected Output: throw DB error từ model
      // CheckDB: userModel.findAll được gọi trước khi throw
      // Rollback: using Jest mocks only, no real DB read
      userModel.findAll.mockRejectedValue(new Error("DB connection failed"));

      await expect(userService.getAllUsers()).rejects.toThrow(
        "DB connection failed",
      );
      expect(userModel.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── getUserById() ─────────────────────────────────────────────────────────
  describe("getUserById()", () => {
    test("TC_USER_10 - Trả về user object khi id tồn tại", async () => {
      // Input: id=1
      // Expected Output: trả về user object từ model
      // CheckDB: userModel.findById được gọi với đúng id
      // Rollback: using Jest mocks only, no real DB read
      const mockUser = { id: 1, name: "Nguyen Van A", email: "a@test.com" };
      userModel.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(userModel.findById).toHaveBeenCalledWith(1);
    });

    test("TC_USER_11 - Trả về null khi id không tồn tại", async () => {
      // Input: id=9999
      // Expected Output: trả về null (không tìm thấy user)
      // CheckDB: userModel.findById được gọi với id=9999
      // Rollback: using Jest mocks only, no real DB read
      userModel.findById.mockResolvedValue(null);

      const result = await userService.getUserById(9999);

      expect(result).toBeNull();
      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(userModel.findById).toHaveBeenCalledWith(9999);
    });

    test("TC_USER_12 - Throw lỗi khi model.findById throw lỗi DB", async () => {
      // Input: id=1
      // Expected Output: throw DB error từ model
      // CheckDB: userModel.findById được gọi trước khi throw
      // Rollback: using Jest mocks only, no real DB read
      userModel.findById.mockRejectedValue(new Error("DB connection failed"));

      await expect(userService.getUserById(1)).rejects.toThrow(
        "DB connection failed",
      );
      expect(userModel.findById).toHaveBeenCalledTimes(1);
      expect(userModel.findById).toHaveBeenCalledWith(1);
    });
  });

  // ── updateUser() ─────────────────────────────────────────────────────────
  describe("updateUser()", () => {
    test("TC_USER_04 - Trả về user đã cập nhật khi id tồn tại và payload hợp lệ", async () => {
      // Input: id=3, data={ name: "Van", phone: "0912345678" }
      // Expected Output: return updated user data from model
      // Mock: userModel.updateById resolves updated object
      // CheckDB: updateById must be called with correct id and payload
      // Rollback: using Jest mocks only, so no real DB write happens
      const payload = { name: "Van", phone: "0912345678" };
      const mockResult = { id: 3, ...payload };

      userModel.updateById.mockResolvedValue(mockResult);

      const result = await userService.updateUser(3, payload);

      expect(userModel.updateById).toHaveBeenCalledTimes(1);
      expect(userModel.updateById).toHaveBeenCalledWith(3, payload);
      expect(result).toEqual(mockResult);
    });

    test("TC_USER_05 - Trả về null khi user id không tồn tại", async () => {
      // Input: id=999, data={ name: "Ghost" }
      // Expected Output: return null (no user updated)
      // Mock: userModel.updateById resolves null
      // CheckDB: updateById must be called with id=999
      // Rollback: using Jest mocks only, so no real DB write happens
      const payload = { name: "Ghost" };
      userModel.updateById.mockResolvedValue(null);

      const result = await userService.updateUser(999, payload);

      expect(userModel.updateById).toHaveBeenCalledTimes(1);
      expect(userModel.updateById).toHaveBeenCalledWith(999, payload);
      expect(result).toBeNull();
    });

    test("TC_USER_06 - Throw lỗi khi model.updateById throw lỗi DB", async () => {
      // Input: id=3, data={ name: "Van" }
      // Expected Output: throw DB error from model
      // Mock: userModel.updateById rejects with error
      // CheckDB: updateById must be called before throwing
      // Rollback: using Jest mocks only, so no real DB write happens
      const payload = { name: "Van" };
      const dbError = new Error("DB update failed");
      userModel.updateById.mockRejectedValue(dbError);

      await expect(userService.updateUser(3, payload)).rejects.toThrow(
        "DB update failed",
      );

      expect(userModel.updateById).toHaveBeenCalledTimes(1);
      expect(userModel.updateById).toHaveBeenCalledWith(3, payload);
    });
  });
});

// ── Negative test cases  ───────────────────────────────────────────────
describe("changePassword() — mật khẩu không đáp ứng yêu cầu (service không validate)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_USER_13
  test("TC_USER_13 - Vẫn đổi password khi newPassword là chuỗi rỗng (service không validate độ dài)", async () => {
    userModel.findByIdWithPassword.mockResolvedValue({
      id: 1,
      password: "hashed_old",
    });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("hashed_empty");
    userModel.updatePassword.mockResolvedValue({ affectedRows: 1 });

    const result = await userService.changePassword(1, "OldPass@1", "");

    expect(result).toEqual({ affectedRows: 1 });
    expect(bcrypt.hash).toHaveBeenCalledWith("", expect.any(Number));
  });

  // TC_USER_14
  test("TC_USER_14 - Throw lỗi USER_NOT_FOUND khi id là null", async () => {
    userModel.findByIdWithPassword.mockResolvedValue(null);

    await expect(
      userService.changePassword(null, "OldPass@1", "NewPass@1"),
    ).rejects.toMatchObject({
      message: "User not found",
      code: "USER_NOT_FOUND",
    });

    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});

describe("updateUser() — payload không hợp lệ", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_USER_15
  test("TC_USER_15 - Trả về kết quả khi data là object rỗng (service không validate payload)", async () => {
    userModel.updateById.mockResolvedValue({ id: 1 });

    const result = await userService.updateUser(1, {});

    expect(result).toEqual({ id: 1 });
    expect(userModel.updateById).toHaveBeenCalledWith(1, {});
  });
});

// ── test service thiếu validation ─────────────────
// Các test dưới đây SẼ FAIL vì service chưa validate newPassword
// Khi sửa service thêm validation → test sẽ PASS
describe("changePassword() — service phải validate newPassword không được rỗng", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_USER_16
  test("TC_USER_16 - Phải throw lỗi khi newPassword là chuỗi rỗng", async () => {
    // Nghiệp vụ: mật khẩu rỗng không được phép đặt làm password mới
    // Hiện tại: service hash chuỗi rỗng và lưu vào DB → lỗ hổng bảo mật nghiêm trọng
    // Cần sửa: thêm if (!newPassword || newPassword.trim() === '') throw error
    userModel.findByIdWithPassword.mockResolvedValue({
      id: 1,
      password: "hashed_old",
    });
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      userService.changePassword(1, "OldPass@1", ""),
    ).rejects.toMatchObject({
      message: "New password cannot be empty",
      code: "INVALID_PASSWORD",
    });

    // Không được hash hoặc lưu password rỗng
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(userModel.updatePassword).not.toHaveBeenCalled();
  });

  // TC_USER_17
  test("TC_USER_17 - Phải throw lỗi khi newPassword chỉ toàn khoảng trắng", async () => {
    // Nghiệp vụ: password "   " sau khi trim là rỗng → không hợp lệ
    // Hiện tại: service KHÔNG validate → hash và lưu "   " vào DB
    userModel.findByIdWithPassword.mockResolvedValue({
      id: 1,
      password: "hashed_old",
    });
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      userService.changePassword(1, "OldPass@1", "   "),
    ).rejects.toMatchObject({
      message: "New password cannot be empty",
      code: "INVALID_PASSWORD",
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(userModel.updatePassword).not.toHaveBeenCalled();
  });
});

describe("updateUser() — service phải validate payload không rỗng", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_USER_18
  test("TC_USER_18 - Phải throw lỗi khi data là object rỗng {} (không có gì để update)", async () => {
    // Nghiệp vụ: update với payload rỗng là vô nghĩa, có thể gây UPDATE không có SET clause
    // Hiện tại: service gọi model với {} → lỗ hổng
    // Cần sửa: thêm if (!data || Object.keys(data).length === 0) throw error
    await expect(userService.updateUser(1, {})).rejects.toMatchObject({
      message: "Update data cannot be empty",
      code: "INVALID_DATA",
    });

    expect(userModel.updateById).not.toHaveBeenCalled();
  });
});

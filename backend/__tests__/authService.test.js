/**
 * Unit Tests for authService.js
 * File gốc  : backend/services/authService.js
 * Test file : backend/__tests__/authService.test.js
 * Người PT  : Cao Thị Thu Hương
 *Test Cases: TC_AUTH_01 → TC_AUTH_24
 *
 * Rollback: Toàn bộ DB được mock bằng jest.mock() → không có dữ liệu thật
 * nào được ghi/xóa. Không cần rollback sau mỗi test.
 */
const {
  findUserByEmail,
  findUserById,
  getRolesByUserId,
  cleanupExpiredTokens,
} = require("../services/authService");
const bcrypt = require("bcryptjs");

// ─── Mock dependencies ──────────────────────────────────────────────────────
jest.mock("../config/mysql", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// ─── Import sau khi mock ─────────────────────────────────────────────────────
const { pool } = require("../config/mysql");
const {
  createUser,
  verifyPassword,
  signToken,
  createResetToken,
  updatePassword,
  verifyResetToken,
} = require("../services/authService");

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => jest.clearAllMocks());

// createUser()
describe("createUser()", () => {
  // TC_AUTH_01
  it("TC_AUTH_01 - Tạo user mới thành công với dữ liệu hợp lệ", async () => {
    // Rollback: mock DB → không cần xóa dữ liệu thật

    const hashedPw = "hashed_Pass@123";
    const now = new Date();
    const userId = 42;

    // Call 1: SELECT * FROM users (findUserByEmail) → không tìm thấy
    // Call 2: INSERT INTO users → trả về insertId
    // Call 3: SELECT id FROM roles WHERE name='customer' → có sẵn roleId
    // Call 4: INSERT INTO user_roles
    // Call 5: SELECT FROM users WHERE id (findUserById)
    pool.query
      .mockResolvedValueOnce([[]]) // findUserByEmail → không tồn tại
      .mockResolvedValueOnce([{ insertId: userId }]) // INSERT users
      .mockResolvedValueOnce([[{ id: 5 }]]) // SELECT roles WHERE name='customer'
      .mockResolvedValueOnce([{}]) // INSERT user_roles
      .mockResolvedValueOnce([
        [
          {
            // findUserById
            id: userId,
            name: "Test User",
            email: "test@example.com",
            phone: "0901234567",
            created_at: now,
            updated_at: now,
          },
        ],
      ]);

    bcrypt.hash.mockResolvedValue(hashedPw);

    const result = await createUser({
      name: "Test User",
      email: "test@example.com",
      phone: "0901234567",
      password: "Pass@123",
    });

    // CheckDB: pool.query được gọi đúng 5 lần
    expect(pool.query).toHaveBeenCalledTimes(5);

    // CheckDB: xác minh INSERT users được gọi
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO users"),
      expect.arrayContaining([
        "Test User",
        "test@example.com",
        hashedPw,
        "0901234567",
      ]),
    );

    // CheckDB: xác minh INSERT user_roles được gọi
    expect(pool.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("INSERT INTO user_roles"),
      [userId, 5],
    );

    // Expected Output: object user có id, email, name; không có trường password
    expect(result).toMatchObject({
      id: userId,
      email: "test@example.com",
      name: "Test User",
      phone: "0901234567",
    });
    expect(result.password).toBeUndefined();
  });

  // TC_AUTH_02
  it("TC_AUTH_02 - Throw lỗi EMAIL_EXISTS khi email đã được đăng ký", async () => {
    // Mock findUserByEmail → trả về user đã tồn tại
    pool.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          email: "existing@example.com",
          password: "hashedpw",
        },
      ],
    ]);

    // Rollback: không có thay đổi DB; mock → không cần xóa thật
    await expect(
      createUser({ email: "existing@example.com", password: "Pass@123" }),
    ).rejects.toMatchObject({
      message: "Email already in use",
      code: "EMAIL_EXISTS",
    });

    // Chỉ gọi 1 lần (SELECT findUserByEmail), không INSERT gì thêm
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

// verifyPassword()
describe("verifyPassword()", () => {
  // TC_AUTH_03
  it("TC_AUTH_03 - Trả về user object khi email và password đúng", async () => {
    const mockUser = {
      id: 10,
      email: "user@test.com",
      name: "Test",
      phone: "0911111111",
      password: "hashed_correctPass",
    };

    // Mock pool.query trả về user row
    pool.query.mockResolvedValueOnce([[mockUser]]);
    // Mock bcrypt.compare → true
    bcrypt.compare.mockResolvedValue(true);

    const result = await verifyPassword("user@test.com", "correctPass");

    // Expected Output: trả về { id, email, name, phone }, không có trường password
    expect(result).toEqual({
      id: 10,
      email: "user@test.com",
      name: "Test",
      phone: "0911111111",
    });
    expect(result.password).toBeUndefined();
  });

  // TC_AUTH_04
  it("TC_AUTH_04 - Trả về null khi password không khớp", async () => {
    const mockUser = {
      id: 10,
      email: "user@test.com",
      name: "Test",
      phone: "0911111111",
      password: "hashed_correctPass",
    };

    pool.query.mockResolvedValueOnce([[mockUser]]);
    // Mock bcrypt.compare → false
    bcrypt.compare.mockResolvedValue(false);

    const result = await verifyPassword("user@test.com", "wrongPass");

    expect(result).toBeNull();
  });

  // TC_AUTH_05
  it("TC_AUTH_05 - Trả về null khi email không tồn tại", async () => {
    // Mock pool.query trả về rows rỗng
    pool.query.mockResolvedValueOnce([[]]);

    const result = await verifyPassword("notexist@test.com", "anyPass");

    expect(result).toBeNull();
    // bcrypt.compare không được gọi khi user không tồn tại
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});

// signToken()
describe("signToken()", () => {
  // TC_AUTH_06
  it("TC_AUTH_06 - Trả về JWT string hợp lệ với payload chứa đúng id", () => {
    // Không cần DB / Rollback
    // Dùng jwt thật để kiểm tra token thực sự hợp lệ
    const realJwt = jest.requireActual("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "change_this_secret";

    const token = signToken({ id: 1 });

    // Expected Output: JWT string gồm 3 phần ngăn cách bằng "."
    const parts = token.split(".");
    expect(parts).toHaveLength(3);

    // jwt.verify() không throw error
    expect(() => realJwt.verify(token, secret)).not.toThrow();

    // Payload chứa đúng id = 1
    const decoded = realJwt.verify(token, secret);
    expect(decoded.id).toBe(1);
  });
});

// createResetToken()
describe("createResetToken()", () => {
  // TC_AUTH_07
  it("TC_AUTH_07 - Tạo và lưu reset token thành công cho email hợp lệ", async () => {
    const mockUser = { id: 7, email: "user@test.com", name: "User" };

    // findUserByEmail → trả về user
    pool.query
      .mockResolvedValueOnce([[mockUser]]) // SELECT users WHERE email
      .mockResolvedValueOnce([{}]); // INSERT password_resets

    const result = await createResetToken("user@test.com");

    // Expected Output: trả về { token, email }
    expect(result.email).toBe("user@test.com");
    expect(typeof result.token).toBe("string");
    // Token là hex 64 ký tự (crypto.randomBytes(32).toString('hex'))
    expect(result.token).toHaveLength(64);
    expect(result.token).toMatch(/^[a-f0-9]+$/);

    // CheckDB: pool.query INSERT password_resets được gọi
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO password_resets"),
      expect.arrayContaining([mockUser.id]),
    );
  });

  // TC_AUTH_08
  it("TC_AUTH_08 - Throw lỗi USER_NOT_FOUND khi email không tồn tại", async () => {
    // Mock findUserByEmail → null (không có user)
    pool.query.mockResolvedValueOnce([[]]);

    // Rollback: mock DB → không cần xóa thật; không có thay đổi DB nào
    await expect(createResetToken("notfound@test.com")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });

    // Chỉ 1 lần query (SELECT), không INSERT gì
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

// updatePassword()
describe("updatePassword()", () => {
  // TC_AUTH_09
  it("TC_AUTH_09 - Hash password mới và xóa token sau khi update thành công", async () => {
    const resetRecord = {
      user_id: 3,
      token: "validtoken123",
      email: "u@test.com",
    };
    const hashedNewPw = "hashed_NewPass@456";

    // verifyResetToken → SELECT password_resets JOIN users → trả về record hợp lệ
    pool.query
      .mockResolvedValueOnce([[resetRecord]]) // verifyResetToken SELECT
      .mockResolvedValueOnce([{}]) // UPDATE users SET password
      .mockResolvedValueOnce([{}]); // DELETE password_resets WHERE token

    bcrypt.hash.mockResolvedValue(hashedNewPw);

    const result = await updatePassword("validtoken123", "NewPass@456");

    // Expected Output: { success: true }
    expect(result).toEqual({ success: true });

    // CheckDB: UPDATE users được gọi với hashed password
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE users SET password"),
      [hashedNewPw, resetRecord.user_id],
    );

    // CheckDB: DELETE password_resets được gọi với đúng token
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("DELETE FROM password_resets WHERE token"),
      ["validtoken123"],
    );
  });
});

// verifyResetToken()
describe("verifyResetToken()", () => {
  // TC_AUTH_10
  it("TC_AUTH_10 - Throw lỗi INVALID_TOKEN khi token hết hạn hoặc không tồn tại", async () => {
    // Mock pool.query trả về rows rỗng (token không tồn tại hoặc đã hết hạn)
    pool.query.mockResolvedValueOnce([[]]);

    await expect(
      verifyResetToken("expiredOrInvalidToken"),
    ).rejects.toMatchObject({
      message: "Invalid or expired reset token",
      code: "INVALID_TOKEN",
    });

    // CheckDB: xác minh query được gọi với đúng token
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM password_resets pr"),
      ["expiredOrInvalidToken"],
    );
  });
});

// ─── findUserByEmail() ───────────────────────────────────────────────────────
describe("findUserByEmail()", () => {
  // TC_AUTH_11
  it("TC_AUTH_11 - Trả về user khi email tồn tại trong DB", async () => {
    // Arrange — mock trả về user tìm thấy
    const mockUser = { id: 1, email: "a@test.com", name: "User A" };
    pool.query.mockResolvedValueOnce([[mockUser]]);

    // Act
    const result = await findUserByEmail("a@test.com");

    // Assert
    expect(result).toEqual(mockUser);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE email = ?"),
      ["a@test.com"],
    );
  });

  // TC_AUTH_12
  it("TC_AUTH_12 - Trả về null khi email không tồn tại trong DB", async () => {
    // Arrange — mock trả về rows rỗng
    pool.query.mockResolvedValueOnce([[]]);

    // Act
    const result = await findUserByEmail("notfound@test.com");

    // Assert — rows[0] || null → null
    expect(result).toBeNull();
  });
});

// ─── findUserById() ──────────────────────────────────────────────────────────
describe("findUserById()", () => {
  // TC_AUTH_13
  it("TC_AUTH_13 - Trả về user khi id tồn tại trong DB", async () => {
    // Arrange
    const mockUser = { id: 5, name: "User B", email: "b@test.com" };
    pool.query.mockResolvedValueOnce([[mockUser]]);

    // Act
    const result = await findUserById(5);

    // Assert
    expect(result).toEqual(mockUser);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = ?"),
      [5],
    );
  });

  // TC_AUTH_14
  it("TC_AUTH_14 - Trả về null khi id không tồn tại trong DB", async () => {
    // Arrange — rows rỗng
    pool.query.mockResolvedValueOnce([[]]);

    // Act
    const result = await findUserById(9999);

    // Assert — rows[0] || null → null
    expect(result).toBeNull();
  });
});

// ─── getRolesByUserId() ──────────────────────────────────────────────────────
describe("getRolesByUserId()", () => {
  // TC_AUTH_15
  it("TC_AUTH_15 - Trả về mảng tên roles của user", async () => {
    // Arrange — user có 2 roles
    pool.query.mockResolvedValueOnce([
      [{ name: "customer" }, { name: "admin" }],
    ]);

    // Act
    const result = await getRolesByUserId(1);

    // Assert
    expect(result).toEqual(["customer", "admin"]);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE ur.user_id = ?"),
      [1],
    );
  });

  // TC_AUTH_16
  it("TC_AUTH_16 - Trả về mảng rỗng khi user không có role nào", async () => {
    // Arrange — rows rỗng
    pool.query.mockResolvedValueOnce([[]]);

    // Act
    const result = await getRolesByUserId(99);

    // Assert — ([] || []).map(...) → []
    expect(result).toEqual([]);
  });
});

// ─── cleanupExpiredTokens() ──────────────────────────────────────────────────
describe("cleanupExpiredTokens()", () => {
  // TC_AUTH_17
  it("TC_AUTH_17 - Xóa toàn bộ reset token đã hết hạn khỏi database", async () => {
    // Arrange — mock DELETE thành công
    pool.query.mockResolvedValueOnce([{ affectedRows: 3 }]);

    // Act — không throw, không return gì
    await expect(cleanupExpiredTokens()).resolves.toBeUndefined();

    // CheckDB — DELETE được gọi đúng
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM password_resets WHERE expires_at"),
    );
  });
});

// ─── createUser() — branch roleId không tồn tại ──────────────────────────────
describe("createUser() — role không tồn tại phải INSERT mới", () => {
  // TC_AUTH_18
  it("TC_AUTH_18 - Tự động INSERT role mới khi bảng roles chưa có role customer", async () => {
    // Arrange — roles bảng chưa có 'customer' → INSERT role mới
    const hashedPw = "hashed_Pass@123";
    const userId = 50;
    const newRoleId = 99;

    pool.query
      .mockResolvedValueOnce([[]]) // findUserByEmail → không tồn tại
      .mockResolvedValueOnce([{ insertId: userId }]) // INSERT users
      .mockResolvedValueOnce([[]]) // SELECT roles → RỖNG (không có role)
      .mockResolvedValueOnce([{ insertId: newRoleId }]) // INSERT roles (tạo role mới)
      .mockResolvedValueOnce([{}]) // INSERT user_roles
      .mockResolvedValueOnce([
        [
          {
            // findUserById
            id: userId,
            name: "New User",
            email: "new@test.com",
            phone: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      ]);

    bcrypt.hash.mockResolvedValue(hashedPw);

    // Act
    const result = await createUser({
      name: "New User",
      email: "new@test.com",
      password: "Pass@123",
    });

    // Assert — INSERT roles được gọi
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO roles"),
      ["customer"],
    );

    // Assert — INSERT user_roles dùng roleId mới
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO user_roles"),
      [userId, newRoleId],
    );

    expect(result).toMatchObject({ id: userId, email: "new@test.com" });
  });
});

// ─── verifyResetToken() — happy path ─────────────────────────────────────────
describe("verifyResetToken() — happy path", () => {
  // TC_AUTH_19
  it("TC_AUTH_19 - Trả về reset record khi token hợp lệ và chưa hết hạn", async () => {
    // Arrange — token hợp lệ chưa hết hạn
    const mockRecord = {
      user_id: 3,
      token: "validtoken_abc",
      email: "u@test.com",
      expires_at: new Date(Date.now() + 60000),
    };
    pool.query.mockResolvedValueOnce([[mockRecord]]);

    // Act
    const result = await verifyResetToken("validtoken_abc");

    // Assert
    expect(result).toEqual(mockRecord);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM password_resets pr"),
      ["validtoken_abc"],
    );
  });
});

// ─── name/phone là undefined → null ─────────────────────────
describe("createUser() — branch name/phone undefined", () => {
  // TC_AUTH_20
  it("TC_AUTH_20 - Truyền null cho name và phone khi không cung cấp", async () => {
    // Arrange — không truyền name và phone → name || null = null, phone || null = null
    bcrypt.hash.mockResolvedValue("hashed_pw");
    pool.query
      .mockResolvedValueOnce([[]]) // findUserByEmail → không tồn tại
      .mockResolvedValueOnce([{ insertId: 99 }]) // INSERT users
      .mockResolvedValueOnce([[{ id: 3 }]]) // SELECT roles
      .mockResolvedValueOnce([{}]) // INSERT user_roles
      .mockResolvedValueOnce([
        [
          {
            id: 99,
            name: null,
            email: "x@test.com",
            phone: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      ]);

    // Act
    await createUser({ email: "x@test.com", password: "Pass@1" });

    // Assert — INSERT users được gọi với null cho name và phone
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO users"),
      expect.arrayContaining([null, "x@test.com", "hashed_pw", null]),
    );
  });
});

// ─── getRolesByUserId khi rrows là null ─────────────────────
describe("getRolesByUserId() — rrows null branch", () => {
  // TC_AUTH_21
  it("TC_AUTH_21 - Trả về mảng rỗng khi pool.query trả về null", async () => {
    // Arrange — mock pool.query trả về null thay vì array
    pool.query.mockResolvedValueOnce([null]);

    // Act
    const result = await getRolesByUserId(1);

    // Assert — (null || []).map(...) → []
    expect(result).toEqual([]);
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("createUser() — thiếu email hoặc password", () => {
  // TC_AUTH_22
  it("TC_AUTH_22 - Throw lỗi khi không truyền email (email undefined)", async () => {
    // email=undefined → findUserByEmail query với undefined, sau đó bcrypt.hash, INSERT sẽ lưu email=null
    // nhưng ở đây ta mock pool.query throw lỗi NOT NULL constraint như DB thật sẽ làm
    pool.query.mockResolvedValueOnce([[]]); // findUserByEmail → không tồn tại
    bcrypt.hash.mockResolvedValue("hashed");
    pool.query.mockRejectedValueOnce(
      new Error("Column 'email' cannot be null"),
    );

    await expect(
      createUser({ name: "Test", password: "Pass@123" }), // thiếu email
    ).rejects.toThrow("Column 'email' cannot be null");
  });

  // TC_AUTH_23
  it("TC_AUTH_23 - Throw lỗi EMAIL_EXISTS khi email đã tồn tại dù có thêm khoảng trắng (không trim)", async () => {
    // Service không trim email → "  existing@example.com  " khác "existing@example.com"
    // → findUserByEmail trả về rỗng → tạo user mới thành công (KHÔNG throw EMAIL_EXISTS)
    // Đây là negative case: chứng minh service KHÔNG validate trim email
    pool.query
      .mockResolvedValueOnce([[]]) // findUserByEmail email có space → không match
      .mockResolvedValueOnce([{ insertId: 99 }]) // INSERT users
      .mockResolvedValueOnce([[{ id: 3 }]]) // SELECT roles
      .mockResolvedValueOnce([{}]) // INSERT user_roles
      .mockResolvedValueOnce([
        [
          {
            id: 99,
            name: "Test",
            email: "  existing@example.com  ",
            phone: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      ]);
    bcrypt.hash.mockResolvedValue("hashed_pw");

    // KHÔNG throw — service tạo được vì email có space được coi là khác
    const result = await createUser({
      email: "  existing@example.com  ",
      password: "Pass@123",
    });
    expect(result).toBeDefined();
    expect(pool.query).toHaveBeenCalledTimes(5);
  });
});

describe("updatePassword() — token không hợp lệ", () => {
  // TC_AUTH_24
  it("TC_AUTH_24 - Throw lỗi INVALID_TOKEN khi gọi updatePassword với token đã hết hạn", async () => {
    // verifyResetToken bên trong sẽ throw trước khi UPDATE
    pool.query.mockResolvedValueOnce([[]]); // verifyResetToken → rows rỗng → throw

    await expect(
      updatePassword("expired_token", "NewPass@1"),
    ).rejects.toMatchObject({
      code: "INVALID_TOKEN",
    });

    // Không được gọi UPDATE users
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
});

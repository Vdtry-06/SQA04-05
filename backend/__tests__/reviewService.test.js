const reviewService = require("../services/reviewService");
const reviewModel = require("../models/reviewModel");
const { pool } = require("../config/mysql");

// Mock các dependencies
jest.mock("../models/reviewModel");
jest.mock("../config/mysql", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("reviewService - Comprehensive Test Suite (TC_REV_01 to TC_REV_16)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- NHÓM 1: canUserReview() ---
  describe("canUserReview()", () => {
    test('TC_REV_01 - Trả về true khi user đã có order "delivered" chứa product này', async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Mock cho query productId
      const result = await reviewService.canUserReview(1, 1);
      expect(result).toBe(true);
    });

    test("TC_REV_02 - Trả về false khi user chưa mua sản phẩm này", async () => {
      pool.query.mockResolvedValueOnce([[]]); // Mảng rỗng
      const result = await reviewService.canUserReview(1, 99);
      expect(result).toBe(false);
    });

    test("TC_REV_11 - Kiểm tra quyền review theo biến thể sản phẩm cụ thể (variantId)", async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Trả về data cho variantId check
      const result = await reviewService.canUserReview(1, null, 10);
      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("product_variant_id = ?"),
        [1, 10],
      );
    });
  });

  // --- NHÓM 2: addOrUpdateReview() ---
  describe("addOrUpdateReview()", () => {
    test("TC_REV_03 - Tạo review mới thành công khi user đủ điều kiện và chưa có review", async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Eligible = true
      reviewModel.findByUserAndProduct.mockResolvedValue(null); // Chưa có review
      reviewModel.create.mockResolvedValue({ id: 100 });
      reviewModel.findByProductId.mockResolvedValue([]);
      reviewModel.getStatsByProductId.mockResolvedValue({});

      const result = await reviewService.addOrUpdateReview(
        1,
        1,
        5,
        "Sản phẩm tốt",
      );

      expect(result.ok).toBe(true);
      expect(reviewModel.create).toHaveBeenCalled();
      expect(reviewModel.update).not.toHaveBeenCalled();
    });

    test("TC_REV_04 - Cập nhật review cũ khi user đã review sản phẩm này trước đó", async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      reviewModel.findByUserAndProduct.mockResolvedValue({ id: 10 }); // Đã có review ID 10
      reviewModel.update.mockResolvedValue({ id: 10 });

      const result = await reviewService.addOrUpdateReview(
        1,
        1,
        4,
        "Đã cập nhật",
      );

      expect(result.ok).toBe(true);
      expect(reviewModel.update).toHaveBeenCalledWith(10, expect.any(Object));
    });

    test("TC_REV_05 - Trả về NOT_ELIGIBLE khi user chưa mua sản phẩm", async () => {
      pool.query.mockResolvedValueOnce([[]]); // canUserReview -> false
      const result = await reviewService.addOrUpdateReview(1, 99, 5, "abc");
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("NOT_ELIGIBLE");
    });

    test("TC_REV_13 - Kiểm tra việc làm sạch (trim) nội dung nhận xét trước khi lưu", async () => {
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
      reviewModel.findByUserAndProduct.mockResolvedValue(null);

      await reviewService.addOrUpdateReview(1, 1, 5, "  Sản phẩm rất tốt  ");

      expect(reviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: "Sản phẩm rất tốt", // Đã bị trim
        }),
      );
    });
  });

  // --- NHÓM 3: addOrUpdateReviewFromOrder() ---
  describe("addOrUpdateReviewFromOrder()", () => {
    test("TC_REV_06 - Lỗi khi đơn hàng không tồn tại hoặc không phải của user", async () => {
      pool.query.mockResolvedValueOnce([[]]);
      const result = await reviewService.addOrUpdateReviewFromOrder(
        1,
        999,
        10,
        5,
        "Fail",
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("NOT_ELIGIBLE");
    });

    test("TC_REV_07 - Lỗi khi đã quá hạn 30 ngày kể từ lúc giao hàng", async () => {
      pool.query.mockResolvedValueOnce([
        [{ product_id: 1, days_since_delivery: 35 }],
      ]);
      const result = await reviewService.addOrUpdateReviewFromOrder(
        1,
        1,
        10,
        5,
        "Late",
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("WINDOW_EXPIRED");
    });

    test("TC_REV_08 - Thành công khi mọi điều kiện hợp lệ", async () => {
      pool.query.mockResolvedValueOnce([
        [{ product_id: 1, days_since_delivery: 10 }],
      ]);
      reviewModel.findByUserAndProduct.mockResolvedValue(null);

      const result = await reviewService.addOrUpdateReviewFromOrder(
        1,
        1,
        10,
        5,
        "Good",
      );
      expect(result.ok).toBe(true);
      expect(reviewModel.create).toHaveBeenCalled();
    });

    test("TC_REV_12 - Cập nhật đánh giá cũ khi thực hiện review từ đơn hàng", async () => {
      pool.query.mockResolvedValueOnce([
        [{ product_id: 1, days_since_delivery: 5 }],
      ]);
      reviewModel.findByUserAndProduct.mockResolvedValue({ id: 50 }); // Đã có review

      await reviewService.addOrUpdateReviewFromOrder(1, 5, 10, 5, "Update");
      expect(reviewModel.update).toHaveBeenCalled();
    });

    test('TC_REV_31 - Chặn đánh giá nếu đơn hàng chưa chuyển sang "delivered"', async () => {
      pool.query.mockResolvedValueOnce([[]]); // Giả lập query tìm status='delivered' không ra data
      const result = await reviewService.addOrUpdateReviewFromOrder(
        1,
        6,
        10,
        5,
        "Not delivered",
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("NOT_ELIGIBLE");
    });
  });

  // --- NHÓM 4: getOrderReviewStatus() ---
  describe("getOrderReviewStatus()", () => {
    test("TC_REV_09 - Lấy trạng thái review và check logic tính ngày còn lại", async () => {
      // Mock query 1: Order info
      pool.query.mockResolvedValueOnce([
        [
          {
            status: "delivered",
            days_since_delivery: 10,
          },
        ],
      ]);
      // Mock query 2: Items list
      pool.query.mockResolvedValueOnce([
        [{ variant_id: 10, product_id: 1, reviewed: 0 }],
      ]);

      const result = await reviewService.getOrderReviewStatus(1, 1);

      expect(result.found).toBe(true);
      expect(result.days_remaining).toBe(20); // 30 - 10 = 20
      expect(result.window_open).toBe(true);
      expect(result.items).toHaveLength(1);
    });

    test("TC_REV_10 - Trả về found: false khi không tìm thấy đơn hàng", async () => {
      pool.query.mockResolvedValueOnce([[]]);
      const result = await reviewService.getOrderReviewStatus(1, 999);
      expect(result.found).toBe(false);
    });
  });
});

// Bổ sung — nâng Branch coverage lên 100%
describe("reviewService — branch coverage bổ sung", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getReviewsForProduct() ────────────────────────────────────────────────
  describe("getReviewsForProduct()", () => {
    // TC_REV_14
    test("TC_REV_14 - Trả về reviews và stats của sản phẩm", async () => {
      // Arrange
      const mockReviews = [{ id: 1, rating: 5, comment: "Tốt" }];
      const mockStats = { avg: 5, count: 1 };
      reviewModel.findByProductId.mockResolvedValue(mockReviews);
      reviewModel.getStatsByProductId.mockResolvedValue(mockStats);

      // Act
      const result = await reviewService.getReviewsForProduct(1);

      // Assert
      expect(result).toEqual({ reviews: mockReviews, stats: mockStats });
      expect(reviewModel.findByProductId).toHaveBeenCalledWith(1);
      expect(reviewModel.getStatsByProductId).toHaveBeenCalledWith(1);
    });
  });

  // ── canUserReview() — variantId có nhưng không tìm thấy, fall-through ────
  describe("canUserReview() — branch bổ sung", () => {
    // TC_REV_15
    test("TC_REV_15 - variantId có nhưng không match, fall-through kiểm tra productId và tìm thấy", async () => {
      // Arrange — query variantId trả về rỗng, query productId tìm thấy
      pool.query
        .mockResolvedValueOnce([[]]) // variantId check → không tìm thấy
        .mockResolvedValueOnce([[{ id: 1 }]]); // productId check → tìm thấy

      // Act
      const result = await reviewService.canUserReview(1, 2, 10);

      // Assert — fall-through sang productId check và trả về true
      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    // TC_REV_16
    test("TC_REV_16 - variantId có nhưng không match, fall-through kiểm tra productId cũng không tìm thấy", async () => {
      // Arrange — cả 2 query đều trả về rỗng
      pool.query
        .mockResolvedValueOnce([[]]) // variantId check → không tìm thấy
        .mockResolvedValueOnce([[]]); // productId check → không tìm thấy

      // Act
      const result = await reviewService.canUserReview(1, 2, 10);

      // Assert — trả về false
      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  // ── addOrUpdateReview() — comment null (safeComment = '') ────────────────
  describe("addOrUpdateReview() — branch bổ sung", () => {
    // TC_REV_17
    test("TC_REV_17 - comment là null thì safeComment fallback về chuỗi rỗng", async () => {
      // Arrange
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // eligible
      reviewModel.findByUserAndProduct.mockResolvedValue(null);
      reviewModel.create.mockResolvedValue({ id: 101 });
      reviewModel.findByProductId.mockResolvedValue([]);
      reviewModel.getStatsByProductId.mockResolvedValue({});

      // Act
      await reviewService.addOrUpdateReview(1, 1, 5, null);

      // Assert — comment ?? '' → '' sau khi trim
      expect(reviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ comment: "" }),
      );
    });
  });

  // ── addOrUpdateReviewFromOrder() — branch bổ sung ────────────────────────
  describe("addOrUpdateReviewFromOrder() — branch bổ sung", () => {
    // TC_REV_18
    test("TC_REV_18 - days_since_delivery là null thì fallback 9999, bị block bởi WINDOW_EXPIRED", async () => {
      // Arrange — days_since_delivery = null → Number(null ?? 9999) = 9999 → 9999 >= 30 → WINDOW_EXPIRED
      pool.query.mockResolvedValueOnce([
        [{ product_id: 1, days_since_delivery: null }],
      ]);

      // Act
      const result = await reviewService.addOrUpdateReviewFromOrder(
        1,
        1,
        10,
        5,
        "Good",
      );

      // Assert — bị chặn vì daysSince = 9999 >= 30
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("WINDOW_EXPIRED");
      expect(result.days_since).toBe(9999);
    });

    // TC_REV_19
    test("TC_REV_19 - comment là null thì safeComment fallback về chuỗi rỗng trong addOrUpdateReviewFromOrder", async () => {
      // Arrange
      pool.query.mockResolvedValueOnce([
        [{ product_id: 1, days_since_delivery: 5 }],
      ]);
      reviewModel.findByUserAndProduct.mockResolvedValue(null);
      reviewModel.create.mockResolvedValue({ id: 201 });
      reviewModel.findByProductId.mockResolvedValue([]);
      reviewModel.getStatsByProductId.mockResolvedValue({});

      // Act
      await reviewService.addOrUpdateReviewFromOrder(1, 1, 10, 5, null);

      // Assert — comment ?? '' → ''
      expect(reviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ comment: "" }),
      );
    });
  });

  // ── getOrderReviewStatus() — branch bổ sung ──────────────────────────────
  describe("getOrderReviewStatus() — branch bổ sung", () => {
    // TC_REV_20
    test("TC_REV_20 - Đơn hàng chưa delivered: days_since và daysRemaining là null, windowOpen=false", async () => {
      // Arrange — status không phải delivered
      pool.query
        .mockResolvedValueOnce([
          [{ status: "pending", days_since_delivery: null }],
        ])
        .mockResolvedValueOnce([
          [{ variant_id: 5, product_id: 2, reviewed: 0 }],
        ]);

      // Act
      const result = await reviewService.getOrderReviewStatus(1, 1);

      // Assert
      expect(result.found).toBe(true);
      expect(result.delivered).toBe(false);
      expect(result.days_since_delivery).toBeNull();
      expect(result.days_remaining).toBeNull();
      expect(result.window_open).toBe(false);
    });

    // TC_REV_21
    test("TC_REV_21 - Đơn hàng delivered đúng 30 ngày: daysRemaining=0, windowOpen=false", async () => {
      // Arrange — days_since_delivery = 30 → daysRemaining = 0, windowOpen = false (30 < 30 là false)
      pool.query
        .mockResolvedValueOnce([
          [{ status: "delivered", days_since_delivery: 30 }],
        ])
        .mockResolvedValueOnce([
          [{ variant_id: 5, product_id: 2, reviewed: 1 }],
        ]);

      // Act
      const result = await reviewService.getOrderReviewStatus(1, 1);

      // Assert
      expect(result.delivered).toBe(true);
      expect(result.days_remaining).toBe(0);
      expect(result.window_open).toBe(false);
      expect(result.items[0].reviewed).toBe(true);
    });

    // TC_REV_22
    test("TC_REV_22 - days_since_delivery là null khi delivered: daysSince=9999, daysRemaining=0, windowOpen=false", async () => {
      // Arrange — delivered nhưng days_since_delivery = null → Number(null ?? 9999) = 9999
      // → isFinite(9999) = true → daysRemaining = Math.max(0, 30 - 9999) = 0, windowOpen = false
      pool.query
        .mockResolvedValueOnce([
          [{ status: "delivered", days_since_delivery: null }],
        ])
        .mockResolvedValueOnce([
          [{ variant_id: 3, product_id: 1, reviewed: 0 }],
        ]);

      // Act
      const result = await reviewService.getOrderReviewStatus(1, 1);

      // Assert
      expect(result.delivered).toBe(true);
      expect(result.days_remaining).toBe(0); // Math.max(0, 30 - 9999) = 0
      expect(result.window_open).toBe(false); // 9999 < 30 = false
    });
  });
});

// ─── o.status là null. bổ sung branch ────────────────────────────────────────
describe("getOrderReviewStatus() — status null branch", () => {
  // TC_REV_23
  test("TC_REV_23 - Đơn hàng tìm thấy nhưng status là null: delivered=false", async () => {
    // Arrange — status = null → String(null || '').toLowerCase() = '' ≠ 'delivered'
    pool.query
      .mockResolvedValueOnce([[{ status: null, days_since_delivery: null }]])
      .mockResolvedValueOnce([[{ variant_id: 1, product_id: 1, reviewed: 0 }]]);

    // Act
    const result = await reviewService.getOrderReviewStatus(1, 1);

    // Assert — delivered = false vì status null không match 'delivered'
    expect(result.found).toBe(true);
    expect(result.delivered).toBe(false);
    expect(result.days_since_delivery).toBeNull();
    expect(result.days_remaining).toBeNull();
    expect(result.window_open).toBe(false);
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("addOrUpdateReview() — rating không hợp lệ (service không validate)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_REV_24
  test("TC_REV_24 - Vẫn tạo review khi rating=0 (service không validate rating, chỉ controller)", async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    reviewModel.findByUserAndProduct.mockResolvedValue(null);
    reviewModel.create.mockResolvedValue({ id: 99, rating: 0 });
    reviewModel.findByProductId.mockResolvedValue([]);
    reviewModel.getStatsByProductId.mockResolvedValue({});

    const result = await reviewService.addOrUpdateReview(1, 1, 0, "Tệ");

    expect(result.ok).toBe(true);
    expect(reviewModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 0 }),
    );
  });

  // TC_REV_25
  test("TC_REV_25 - Vẫn tạo review khi rating=6 (vượt max, service không validate)", async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    reviewModel.findByUserAndProduct.mockResolvedValue(null);
    reviewModel.create.mockResolvedValue({ id: 100, rating: 6 });
    reviewModel.findByProductId.mockResolvedValue([]);
    reviewModel.getStatsByProductId.mockResolvedValue({});

    const result = await reviewService.addOrUpdateReview(1, 1, 6, "Tốt quá");

    expect(result.ok).toBe(true);
    expect(reviewModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 6 }),
    );
  });
});

describe("addOrUpdateReviewFromOrder() — ngưỡng biên 30 ngày", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_REV_26
  test("TC_REV_26 - Vẫn cho phép review khi đúng 29 ngày (ngưỡng biên cuối cùng còn window)", async () => {
    pool.query.mockResolvedValueOnce([
      [{ product_id: 1, days_since_delivery: 29 }],
    ]);
    reviewModel.findByUserAndProduct.mockResolvedValue(null);
    reviewModel.create.mockResolvedValue({ id: 200 });
    reviewModel.findByProductId.mockResolvedValue([]);
    reviewModel.getStatsByProductId.mockResolvedValue({});

    const result = await reviewService.addOrUpdateReviewFromOrder(
      1,
      1,
      10,
      5,
      "Tốt",
    );

    expect(result.ok).toBe(true);
    expect(reviewModel.create).toHaveBeenCalled();
  });

  // TC_REV_27
  test("TC_REV_27 - Chặn review khi đúng 30 ngày (ngưỡng biên đóng window)", async () => {
    pool.query.mockResolvedValueOnce([
      [{ product_id: 1, days_since_delivery: 30 }],
    ]);

    const result = await reviewService.addOrUpdateReviewFromOrder(
      1,
      1,
      10,
      5,
      "Tốt",
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("WINDOW_EXPIRED");
    expect(result.days_since).toBe(30);
    expect(reviewModel.create).not.toHaveBeenCalled();
  });
});

// Các test dưới đây SẼ FAIL vì service chưa validate rating
// Khi sửa service thêm validation → test sẽ PASS
describe("addOrUpdateReview() — service phải validate rating hợp lệ (1-5)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_REV_28
  test("TC_REV_28 - Phải trả về ok:false khi rating=0 (nhỏ hơn min=1)", async () => {
    // Nghiệp vụ: rating hợp lệ là 1-5. rating=0 phải bị chặn ngay tại service
    // Hiện tại: service KHÔNG validate → test này FAIL
    // Cần sửa: thêm if (rating < 1 || rating > 5) return { ok: false, reason: 'INVALID_RATING' }
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // eligible

    const result = await reviewService.addOrUpdateReview(1, 1, 0, "Tệ");

    expect(result).toEqual({ ok: false, reason: "INVALID_RATING" });
    expect(reviewModel.create).not.toHaveBeenCalled();
  });

  // TC_REV_29
  test("TC_REV_29 - Phải trả về ok:false khi rating=6 (lớn hơn max=5)", async () => {
    // Nghiệp vụ: rating > 5 không hợp lệ, phải bị chặn tại service
    // Hiện tại: service KHÔNG validate → test này FAIL
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // eligible

    const result = await reviewService.addOrUpdateReview(1, 1, 6, "Tốt quá");

    expect(result).toEqual({ ok: false, reason: "INVALID_RATING" });
    expect(reviewModel.create).not.toHaveBeenCalled();
  });

  // TC_REV_30
  test("TC_REV_30 - Phải trả về ok:false khi rating là chuỗi (không phải số)", async () => {
    // Nghiệp vụ: rating phải là số nguyên 1-5
    // Hiện tại: service KHÔNG validate kiểu → test này FAIL
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // eligible

    const result = await reviewService.addOrUpdateReview(
      1,
      1,
      "abc",
      "Bình thường",
    );

    expect(result).toEqual({ ok: false, reason: "INVALID_RATING" });
    expect(reviewModel.create).not.toHaveBeenCalled();
  });
});

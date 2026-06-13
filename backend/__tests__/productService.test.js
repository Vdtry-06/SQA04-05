/**
 * Unit Test — ProductService
 * File gốc  : backend/services/productService.js
 * Test file : backend/__tests__/productService.test.js
 * Người PT  : Cao Thị Thu Hương
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock productModel,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

// ── Mock toàn bộ productModel — không dùng DB thật ──────────────────────────
jest.mock("../models/productModel");

const productModel = require("../models/productModel");
const ProductService = require("../services/productService");

describe("ProductService", () => {
  // Reset tất cả mock trước mỗi test để tránh ảnh hưởng lẫn nhau
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createProduct() ───────────────────────────────────────────────────────
  describe("createProduct()", () => {
    // TC_PROD_01
    test("TC_PROD_01 — Tạo sản phẩm mới thành công và trả về product object", async () => {
      // Arrange — mock dữ liệu trả về khi tạo sản phẩm thành công
      const inputData = {
        name: "Táo đỏ",
        price: 50000,
        category_id: 1,
        variants: [{ name: "1kg", stock: 100, price_sale: 45000 }],
      };
      const mockProduct = {
        id: 10,
        name: "Táo đỏ",
        price: 50000,
        category_id: 1,
        variants: [{ name: "1kg", stock: 100, price_sale: 45000 }],
      };
      productModel.createWithVariants.mockResolvedValue(mockProduct);

      // Act — gọi hàm cần test
      const result = await ProductService.createProduct(inputData);

      // Assert — kết quả trả về đúng product object có id
      expect(result).toEqual(mockProduct);
      expect(result).toHaveProperty("id");

      // CheckDB — xác minh createWithVariants được gọi đúng 1 lần với đúng data
      expect(productModel.createWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.createWithVariants).toHaveBeenCalledWith(inputData);

      // Rollback: dùng mock => không cần rollback
    });

    // TC_PROD_06
    test("TC_PROD_06 — Throw lỗi khi createWithVariants thất bại", async () => {
      // Arrange — mock createWithVariants throw lỗi (ví dụ: category không tồn tại)
      const inputData = {
        name: "Sản phẩm lỗi",
        price: 10000,
        category_id: 9999,
        variants: [],
      };
      productModel.createWithVariants.mockRejectedValue(
        new Error("Foreign key constraint fails: category_id not found"),
      );

      // Act & Assert
      await expect(ProductService.createProduct(inputData)).rejects.toThrow(
        "Foreign key constraint fails: category_id not found",
      );

      // CheckDB — createWithVariants vẫn được gọi đúng 1 lần với đúng data
      expect(productModel.createWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.createWithVariants).toHaveBeenCalledWith(inputData);
    });
  });

  // ── getAllProducts() ──────────────────────────────────────────────────────
  describe("getAllProducts()", () => {
    // TC_PROD_13
    test("TC_PROD_13 — Trả về tất cả sản phẩm kèm variants cho admin", async () => {
      // Arrange — mock findAllWithVariants trả về danh sách sản phẩm kèm variants
      const mockProducts = [
        {
          id: 1,
          name: "Táo đỏ",
          price: 50000,
          variants: [{ name: "1kg", stock: 100 }],
        },
        {
          id: 2,
          name: "Cam vàng",
          price: 30000,
          variants: [{ name: "500g", stock: 50 }],
        },
      ];
      productModel.findAllWithVariants.mockResolvedValue(mockProducts);

      // Act
      const result = await ProductService.getAllProducts();

      // Assert — trả về array có ít nhất 1 sản phẩm, mỗi sản phẩm có trường variants
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(mockProducts);
      expect(result[0]).toHaveProperty("variants");

      // CheckDB — findAllWithVariants được gọi đúng 1 lần, không có tham số
      expect(productModel.findAllWithVariants).toHaveBeenCalledTimes(1);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── getAllActiveProducts() ────────────────────────────────────────────────
  describe("getAllActiveProducts()", () => {
    // TC_PROD_14
    test("TC_PROD_14 — Trả về danh sách sản phẩm active cho trang chủ", async () => {
      // Arrange — mock findAllActive trả về array sản phẩm có status active
      const mockActiveProducts = [
        { id: 1, name: "Táo đỏ", price: 50000, status: "active" },
        { id: 3, name: "Nho đen", price: 80000, status: "active" },
      ];
      productModel.findAllActive.mockResolvedValue(mockActiveProducts);

      // Act
      const result = await ProductService.getAllActiveProducts();

      // Assert — trả về array sản phẩm active
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(mockActiveProducts);

      // CheckDB — findAllActive được gọi đúng 1 lần
      expect(productModel.findAllActive).toHaveBeenCalledTimes(1);

      // Rollback: dùng mock => không cần rollback
    });

    // TC_PROD_15
    test("TC_PROD_15 — Trả về mảng rỗng khi không có sản phẩm active nào", async () => {
      // Arrange — mock findAllActive trả về array rỗng
      productModel.findAllActive.mockResolvedValue([]);

      // Act
      const result = await ProductService.getAllActiveProducts();

      // Assert — kết quả phải là [] (array rỗng)
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      // CheckDB — findAllActive vẫn được gọi đúng 1 lần
      expect(productModel.findAllActive).toHaveBeenCalledTimes(1);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── getProductDetail() ────────────────────────────────────────────────────
  describe("getProductDetail()", () => {
    // TC_PROD_02
    test("TC_PROD_02 — Trả về sản phẩm kèm variants khi product tồn tại", async () => {
      // Arrange — mock dữ liệu trả về khi tìm thấy sản phẩm kèm variants
      const mockProduct = {
        id: 1,
        name: "Táo đỏ",
        price: 50000,
        variants: [
          { name: "500g", stock: 50, price_sale: 25000 },
          { name: "1kg", stock: 100, price_sale: 45000 },
        ],
      };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);

      // Act
      const result = await ProductService.getProductDetail(1);

      // Assert — kết quả trả về product object có trường variants là array không rỗng
      expect(result).toEqual(mockProduct);
      expect(result).toHaveProperty("variants");
      expect(Array.isArray(result.variants)).toBe(true);
      expect(result.variants.length).toBeGreaterThan(0);

      // CheckDB — xác minh findByIdWithVariants được gọi đúng 1 lần với đúng tham số
      expect(productModel.findByIdWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.findByIdWithVariants).toHaveBeenCalledWith(1);
    });

    // TC_PROD_07
    test("TC_PROD_07 — Trả về null khi id sản phẩm không tồn tại trong getProductDetail", async () => {
      // Arrange — mock findByIdWithVariants trả về null (không tìm thấy sản phẩm)
      productModel.findByIdWithVariants.mockResolvedValue(null);

      // Act
      const result = await ProductService.getProductDetail(9999);

      // Assert — kết quả phải là null
      expect(result).toBeNull();

      // CheckDB — xác minh findByIdWithVariants vẫn được gọi đúng 1 lần với đúng id
      expect(productModel.findByIdWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.findByIdWithVariants).toHaveBeenCalledWith(9999);
    });
  });

  // ── getProductsByCategory() ───────────────────────────────────────────────
  describe("getProductsByCategory()", () => {
    // TC_PROD_16
    test("TC_PROD_16 — Trả về danh sách sản phẩm khi categoryId hợp lệ", async () => {
      // Arrange — mock findByCategory trả về array sản phẩm thuộc category
      const mockProducts = [
        { id: 1, name: "Táo đỏ", price: 50000, category_id: 1 },
        { id: 2, name: "Cam vàng", price: 30000, category_id: 1 },
      ];
      productModel.findByCategory.mockResolvedValue(mockProducts);

      // Act
      const result = await ProductService.getProductsByCategory(1);

      // Assert — trả về array có ít nhất 1 sản phẩm
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(mockProducts);

      // CheckDB — findByCategory được gọi đúng 1 lần với đúng categoryId
      expect(productModel.findByCategory).toHaveBeenCalledTimes(1);
      expect(productModel.findByCategory).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không cần rollback
    });

    // TC_PROD_17
    test("TC_PROD_17 — Trả về mảng rỗng khi danh mục không có sản phẩm nào", async () => {
      // Arrange — mock findByCategory trả về [] (không có sản phẩm nào thuộc category này)
      productModel.findByCategory.mockResolvedValue([]);

      // Act
      const result = await ProductService.getProductsByCategory(9999);

      // Assert — kết quả phải là [] (array rỗng)
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      // CheckDB — findByCategory vẫn được gọi đúng 1 lần với đúng categoryId
      expect(productModel.findByCategory).toHaveBeenCalledTimes(1);
      expect(productModel.findByCategory).toHaveBeenCalledWith(9999);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── searchProductByName() ─────────────────────────────────────────────────
  describe("searchProductByName()", () => {
    // TC_PROD_03
    test("TC_PROD_03 — Trả về array sản phẩm khi từ khóa khớp với tên", async () => {
      // Arrange — mock trả về danh sách có ít nhất 1 sản phẩm khớp từ khóa
      const mockProducts = [
        { id: 1, name: "Táo đỏ", price: 50000 },
        { id: 2, name: "Táo xanh", price: 45000 },
      ];
      productModel.findByName.mockResolvedValue(mockProducts);

      // Act
      const result = await ProductService.searchProductByName("Táo");

      // Assert — kết quả trả về array chứa ít nhất 1 sản phẩm
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(mockProducts);

      // CheckDB — xác minh findByName được gọi đúng 1 lần với đúng từ khóa
      expect(productModel.findByName).toHaveBeenCalledTimes(1);
      expect(productModel.findByName).toHaveBeenCalledWith("Táo");
    });

    // TC_PROD_04
    test("TC_PROD_04 — Trả về mảng rỗng khi không có sản phẩm khớp từ khóa", async () => {
      // Arrange — mock trả về array rỗng vì không có sản phẩm khớp
      productModel.findByName.mockResolvedValue([]);

      // Act
      const result = await ProductService.searchProductByName("XYZKhongTonTai");

      // Assert — kết quả phải là [] (array rỗng)
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      // CheckDB — xác minh findByName vẫn được gọi đúng 1 lần với đúng từ khóa
      expect(productModel.findByName).toHaveBeenCalledTimes(1);
      expect(productModel.findByName).toHaveBeenCalledWith("XYZKhongTonTai");
    });
  });

  // ── getProductById() ──────────────────────────────────────────────────────
  describe("getProductById()", () => {
    // TC_PROD_18
    test("TC_PROD_18 — Trả về sản phẩm (không kèm variants) khi id tồn tại", async () => {
      // Arrange — mock findById trả về product object không có variants
      const mockProduct = {
        id: 1,
        name: "Táo đỏ",
        price: 50000,
        category_id: 1,
      };
      productModel.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await ProductService.getProductById(1);

      // Assert — trả về product có id=1, không có trường variants
      expect(result).toEqual(mockProduct);
      expect(result).toHaveProperty("id", 1);
      expect(result).not.toHaveProperty("variants");

      // CheckDB — findById được gọi đúng 1 lần với đúng id
      expect(productModel.findById).toHaveBeenCalledTimes(1);
      expect(productModel.findById).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không cần rollback
    });

    // TC_PROD_19
    test("TC_PROD_19 — Trả về null khi id sản phẩm không tồn tại trong getProductById", async () => {
      // Arrange — mock findById trả về null
      productModel.findById.mockResolvedValue(null);

      // Act
      const result = await ProductService.getProductById(9999);

      // Assert — kết quả phải là null
      expect(result).toBeNull();

      // CheckDB — findById được gọi đúng 1 lần với đúng id
      expect(productModel.findById).toHaveBeenCalledTimes(1);
      expect(productModel.findById).toHaveBeenCalledWith(9999);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── updateProduct() ───────────────────────────────────────────────────────
  describe("updateProduct()", () => {
    // TC_PROD_08
    test("TC_PROD_08 — Trả về sản phẩm đã cập nhật khi update thành công", async () => {
      // Arrange — mock updateWithVariants trả về product đã được cập nhật
      const updateData = {
        name: "Táo đỏ New Zealand",
        price: 60000,
        variants: [{ name: "1kg", stock: 80, price_sale: 55000 }],
      };
      const mockUpdated = {
        id: 1,
        name: "Táo đỏ New Zealand",
        price: 60000,
        variants: [{ name: "1kg", stock: 80, price_sale: 55000 }],
      };
      productModel.updateWithVariants.mockResolvedValue(mockUpdated);

      // Act
      const result = await ProductService.updateProduct(1, updateData);

      // Assert — kết quả trả về product đã được cập nhật đúng
      expect(result).toEqual(mockUpdated);
      expect(result).toHaveProperty("id", 1);
      expect(result).toHaveProperty("name", "Táo đỏ New Zealand");

      // CheckDB — updateWithVariants được gọi đúng 1 lần với đúng id và data
      expect(productModel.updateWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.updateWithVariants).toHaveBeenCalledWith(
        1,
        updateData,
      );

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_PROD_09
    test("TC_PROD_09 — Trả về null khi id sản phẩm không tồn tại trong updateProduct", async () => {
      // Arrange — mock updateWithVariants trả về null (id không tồn tại trong DB)
      const updateData = { name: "Sản phẩm không tồn tại", price: 10000 };
      productModel.updateWithVariants.mockResolvedValue(null);

      // Act
      const result = await ProductService.updateProduct(9999, updateData);

      // Assert — kết quả phải là null
      expect(result).toBeNull();

      // CheckDB — updateWithVariants vẫn được gọi đúng 1 lần với đúng id và data
      expect(productModel.updateWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.updateWithVariants).toHaveBeenCalledWith(
        9999,
        updateData,
      );
    });

    // TC_PROD_10
    test("TC_PROD_10 — Throw lỗi khi updateWithVariants thất bại", async () => {
      // Arrange — mock updateWithVariants throw lỗi (DB error)
      const updateData = { name: "Lỗi DB", price: 10000 };
      productModel.updateWithVariants.mockRejectedValue(
        new Error("Database connection lost"),
      );

      // Act & Assert
      await expect(ProductService.updateProduct(1, updateData)).rejects.toThrow(
        "Database connection lost",
      );

      // CheckDB — updateWithVariants vẫn được gọi đúng 1 lần
      expect(productModel.updateWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.updateWithVariants).toHaveBeenCalledWith(
        1,
        updateData,
      );
    });
  });

  // ── deleteProduct() ───────────────────────────────────────────────────────
  describe("deleteProduct()", () => {
    // TC_PROD_05
    test("TC_PROD_05 — Gọi removeWithVariants và trả về kết quả khi product tồn tại", async () => {
      // Arrange — mock trả về kết quả xóa thành công
      const mockDeleteResult = { affectedRows: 1 };
      productModel.removeWithVariants.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await ProductService.deleteProduct(1);

      // Assert — removeWithVariants được gọi với id=1; trả về kết quả xóa
      expect(result).toEqual(mockDeleteResult);
      expect(result).toHaveProperty("affectedRows", 1);

      // CheckDB — xác minh removeWithVariants được gọi đúng 1 lần với đúng id
      expect(productModel.removeWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.removeWithVariants).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_PROD_11
    test("TC_PROD_11 — Trả về affectedRows=0 khi id sản phẩm không tồn tại trong deleteProduct", async () => {
      // Arrange — mock removeWithVariants trả về affectedRows=0 (id không tồn tại)
      const mockDeleteResult = { affectedRows: 0 };
      productModel.removeWithVariants.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await ProductService.deleteProduct(9999);

      // Assert — affectedRows phải là 0, không có bản ghi nào bị xóa
      expect(result).toEqual(mockDeleteResult);
      expect(result).toHaveProperty("affectedRows", 0);

      // CheckDB — removeWithVariants vẫn được gọi đúng 1 lần với đúng id
      expect(productModel.removeWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.removeWithVariants).toHaveBeenCalledWith(9999);
    });

    // TC_PROD_12
    test("TC_PROD_12 — Throw lỗi khi removeWithVariants thất bại", async () => {
      // Arrange — mock removeWithVariants throw lỗi (ví dụ: foreign key constraint)
      productModel.removeWithVariants.mockRejectedValue(
        new Error("Cannot delete: product is referenced by existing orders"),
      );

      // Act & Assert
      await expect(ProductService.deleteProduct(1)).rejects.toThrow(
        "Cannot delete: product is referenced by existing orders",
      );

      // CheckDB — removeWithVariants vẫn được gọi đúng 1 lần với đúng id
      expect(productModel.removeWithVariants).toHaveBeenCalledTimes(1);
      expect(productModel.removeWithVariants).toHaveBeenCalledWith(1);
    });
  });

  // ── deleteVariant() ───────────────────────────────────────────────────────
  describe("deleteVariant()", () => {
    // TC_PROD_20
    test("TC_PROD_20 — Xóa variant thành công khi variantId tồn tại", async () => {
      // Arrange — mock deleteVariantById trả về kết quả xóa thành công
      const mockDeleteResult = { affectedRows: 1 };
      productModel.deleteVariantById.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await ProductService.deleteVariant(5);

      // Assert — trả về {affectedRows: 1}
      expect(result).toEqual(mockDeleteResult);
      expect(result).toHaveProperty("affectedRows", 1);

      // CheckDB — deleteVariantById được gọi đúng 1 lần với đúng variantId
      expect(productModel.deleteVariantById).toHaveBeenCalledTimes(1);
      expect(productModel.deleteVariantById).toHaveBeenCalledWith(5);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_PROD_21
    test("TC_PROD_21 — Trả về affectedRows=0 khi variantId không tồn tại", async () => {
      // Arrange — mock deleteVariantById trả về affectedRows=0 (variantId không tồn tại)
      const mockDeleteResult = { affectedRows: 0 };
      productModel.deleteVariantById.mockResolvedValue(mockDeleteResult);

      // Act
      const result = await ProductService.deleteVariant(9999);

      // Assert — affectedRows phải là 0
      expect(result).toEqual(mockDeleteResult);
      expect(result).toHaveProperty("affectedRows", 0);

      // CheckDB — deleteVariantById vẫn được gọi đúng 1 lần với đúng variantId
      expect(productModel.deleteVariantById).toHaveBeenCalledTimes(1);
      expect(productModel.deleteVariantById).toHaveBeenCalledWith(9999);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_PROD_22
    test("TC_PROD_22 — Throw lỗi khi deleteVariantById thất bại", async () => {
      // Arrange — mock deleteVariantById throw lỗi (DB error)
      productModel.deleteVariantById.mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await expect(ProductService.deleteVariant(1)).rejects.toThrow(
        "Database error",
      );

      // CheckDB — deleteVariantById vẫn được gọi đúng 1 lần với đúng variantId
      expect(productModel.deleteVariantById).toHaveBeenCalledTimes(1);
      expect(productModel.deleteVariantById).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("createProduct() — dữ liệu không hợp lệ (service không validate)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_PROD_23
  test("TC_PROD_23 — Vẫn tạo sản phẩm khi name là chuỗi rỗng — service không validate", async () => {
    // Nghiệp vụ: tên sản phẩm rỗng là không hợp lệ
    // Hiện tại: service không kiểm tra → gọi thẳng model → lỗ hổng
    productModel.createWithVariants.mockResolvedValue({ id: 1, name: "" });

    const result = await ProductService.createProduct({
      name: "",
      price: 50000,
      category_id: 1,
    });

    // Service KHÔNG chặn → gọi model với name rỗng
    expect(productModel.createWithVariants).toHaveBeenCalledWith(
      expect.objectContaining({ name: "" }),
    );
    expect(result).toBeDefined();
  });

  // TC_PROD_24
  test("TC_PROD_24 — Vẫn tạo sản phẩm khi price âm — service không validate", async () => {
    // Nghiệp vụ: giá âm là không hợp lệ về mặt nghiệp vụ
    // Hiện tại: service không kiểm tra → lỗ hổng
    productModel.createWithVariants.mockResolvedValue({ id: 2, price: -10000 });

    const result = await ProductService.createProduct({
      name: "Sản phẩm X",
      price: -10000,
      category_id: 1,
    });

    expect(productModel.createWithVariants).toHaveBeenCalledWith(
      expect.objectContaining({ price: -10000 }),
    );
    expect(result).toBeDefined();
  });

  // TC_PROD_25
  test("TC_PROD_25 — Vẫn tạo sản phẩm khi không có variants — service không validate", async () => {
    // Nghiệp vụ: sản phẩm phải có ít nhất 1 variant
    // Hiện tại: service không kiểm tra variants → lỗ hổng
    productModel.createWithVariants.mockResolvedValue({ id: 3 });

    const result = await ProductService.createProduct({
      name: "SP Y",
      price: 50000,
      category_id: 1,
      variants: [],
    });

    expect(productModel.createWithVariants).toHaveBeenCalledWith(
      expect.objectContaining({ variants: [] }),
    );
    expect(result).toBeDefined();
  });

  // TC_PROD_26
  test("TC_PROD_26 — Vẫn tạo sản phẩm khi price=0 — service không validate", async () => {
    // Nghiệp vụ: giá = 0 không có ý nghĩa nghiệp vụ
    productModel.createWithVariants.mockResolvedValue({ id: 4, price: 0 });

    const result = await ProductService.createProduct({
      name: "SP Z",
      price: 0,
      category_id: 1,
    });

    expect(productModel.createWithVariants).toHaveBeenCalledWith(
      expect.objectContaining({ price: 0 }),
    );
    expect(result).toBeDefined();
  });
});

describe("updateProduct() — dữ liệu không hợp lệ (service không validate)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_PROD_27
  test("TC_PROD_27 — Vẫn update khi data là object rỗng {} — service không validate payload", async () => {
    // Nghiệp vụ: update với payload rỗng là vô nghĩa
    productModel.updateWithVariants.mockResolvedValue({ id: 1 });

    const result = await ProductService.updateProduct(1, {});

    // Service KHÔNG chặn payload rỗng → lỗ hổng
    expect(productModel.updateWithVariants).toHaveBeenCalledWith(1, {});
    expect(result).toBeDefined();
  });

  // TC_PROD_28
  test("TC_PROD_28 — Vẫn update khi name là null — service không validate", async () => {
    // Nghiệp vụ: tên sản phẩm null là không hợp lệ
    productModel.updateWithVariants.mockResolvedValue({ id: 1, name: null });

    const result = await ProductService.updateProduct(1, {
      name: null,
      price: 50000,
    });

    expect(productModel.updateWithVariants).toHaveBeenCalledWith(1, {
      name: null,
      price: 50000,
    });
    expect(result).toBeDefined();
  });

  // TC_PROD_29
  test("TC_PROD_29 — Vẫn update khi price âm — service không validate", async () => {
    // Nghiệp vụ: giá âm không hợp lệ
    productModel.updateWithVariants.mockResolvedValue({ id: 1, price: -5000 });

    const result = await ProductService.updateProduct(1, { price: -5000 });

    expect(productModel.updateWithVariants).toHaveBeenCalledWith(1, {
      price: -5000,
    });
    expect(result).toBeDefined();
  });
});

// ── test service thiếu validation ─────────────────
describe("createProduct() — service phải validate dữ liệu đầu vào", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_PROD_30
  test("TC_PROD_30 — Phải throw lỗi khi name là chuỗi rỗng — service CHƯA validate", async () => {
    // Nghiệp vụ: tên sản phẩm bắt buộc, không được rỗng
    // Test FAIL vì service chưa có validation này
    // Cần sửa: thêm if (!data.name || data.name.trim() === '') throw error
    await expect(
      ProductService.createProduct({ name: "", price: 50000, category_id: 1 }),
    ).rejects.toThrow("Product name cannot be empty");

    expect(productModel.createWithVariants).not.toHaveBeenCalled();
  });

  // TC_PROD_31
  test("TC_PROD_31 — Phải throw lỗi khi price âm hoặc bằng 0 — service CHƯA validate", async () => {
    // Nghiệp vụ: giá sản phẩm phải > 0
    // Test FAIL vì service chưa có validation này
    // Cần sửa: thêm if (!data.price || data.price <= 0) throw error
    await expect(
      ProductService.createProduct({
        name: "SP hợp lệ",
        price: -1000,
        category_id: 1,
      }),
    ).rejects.toThrow("Product price must be greater than 0");

    expect(productModel.createWithVariants).not.toHaveBeenCalled();
  });

  // TC_PROD_32
  test("TC_PROD_32 — Phải throw lỗi khi variants rỗng hoặc không có — service CHƯA validate", async () => {
    // Nghiệp vụ: sản phẩm phải có ít nhất 1 variant
    // Test FAIL vì service chưa có validation này
    // Cần sửa: thêm if (!data.variants || data.variants.length === 0) throw error
    await expect(
      ProductService.createProduct({
        name: "SP hợp lệ",
        price: 50000,
        category_id: 1,
        variants: [],
      }),
    ).rejects.toThrow("Product must have at least one variant");

    expect(productModel.createWithVariants).not.toHaveBeenCalled();
  });
});

describe("updateProduct() — service phải validate dữ liệu đầu vào", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_PROD_33
  test("TC_PROD_33 — Phải throw lỗi khi data là object rỗng {} — service CHƯA validate", async () => {
    // Nghiệp vụ: update với payload rỗng không có ý nghĩa
    // Test FAIL vì service chưa có validation này
    // Cần sửa: thêm if (!data || Object.keys(data).length === 0) throw error
    await expect(ProductService.updateProduct(1, {})).rejects.toThrow(
      "Update data cannot be empty",
    );

    expect(productModel.updateWithVariants).not.toHaveBeenCalled();
  });

  // TC_PROD_34
  test("TC_PROD_34 — Phải throw lỗi khi price âm trong updateProduct — service CHƯA validate", async () => {
    // Nghiệp vụ: không cho phép cập nhật giá âm
    // Test FAIL vì service chưa có validation này
    await expect(
      ProductService.updateProduct(1, { price: -500 }),
    ).rejects.toThrow("Product price must be greater than 0");

    expect(productModel.updateWithVariants).not.toHaveBeenCalled();
  });
});

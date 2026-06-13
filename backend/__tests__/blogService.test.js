/**
 * Unit Test — blogService
 * File gốc  : backend/services/blogService.js
 * Test file : backend/__tests__/blogService.test.js
 * Người PT  : Trịnh Quang Lâm
 *
 * Rollback  : Toàn bộ test dùng jest.mock() để mock blogModel,
 *             không kết nối DB thật => không có dữ liệu nào được
 *             tạo / thay đổi => KHÔNG cần rollback sau khi chạy test.
 */

// ── Mock toàn bộ blogModel ──────────────────────────────
jest.mock("../models/blogModel");

const blogModel = require("../models/blogModel");
const blogService = require("../services/blogService");

describe("blogService", () => {
  // Reset tất cả mock trước mỗi test để tránh ảnh hưởng lẫn nhau
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createBlog() ───────────────────────────────────────────────────────────
  describe("createBlog()", () => {
    // TC_BLOG_01
    test("TC_BLOG_01 — Tạo blog thành công khi blogData hợp lệ", async () => {
      // Arrange — mock blogModel.create trả về blog object
      const mockBlog = {
        id: 1,
        title: "Tiêu đề",
        content: "Nội dung bài viết",
        author_id: 1,
      };
      blogModel.create.mockResolvedValue(mockBlog);

      const blogData = {
        title: "Tiêu đề",
        content: "Nội dung bài viết",
        author_id: 1,
      };

      // Act
      const result = await blogService.createBlog(blogData);

      // Assert — trả về thành công kèm data
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlog);

      // CheckDB — blogModel.create() phải được gọi đúng 1 lần với đúng data
      expect(blogModel.create).toHaveBeenCalledTimes(1);
      expect(blogModel.create).toHaveBeenCalledWith(blogData);
    });

    // TC_BLOG_02
    test("TC_BLOG_02 — Trả về success:false khi title bị bỏ trống", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB
      const blogData = { title: "", content: "Nội dung" };

      // Act
      const result = await blogService.createBlog(blogData);

      // Assert — trả về lỗi validation
      expect(result).toEqual({
        success: false,
        message: "Tiêu đề và nội dung bài viết không được trống",
        data: null,
      });

      // CheckDB — blogModel.create() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.create).not.toHaveBeenCalled();
    });

    // TC_BLOG_13
    test("TC_BLOG_13 — Trả về success:false khi content bị bỏ trống trong createBlog", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB
      const blogData = { title: "Tiêu đề", content: "" };

      // Act
      const result = await blogService.createBlog(blogData);

      // Assert — trả về lỗi validation khi content bỏ trống
      expect(result).toEqual({
        success: false,
        message: "Tiêu đề và nội dung bài viết không được trống",
        data: null,
      });

      // CheckDB — blogModel.create() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.create).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào được tạo => không cần rollback
    });
  });

  // ── getBlogDetail() ────────────────────────────────────────────────────────
  describe("getBlogDetail()", () => {
    // TC_BLOG_03
    test("TC_BLOG_03 — Trả về blog kèm comments khi blogId tồn tại", async () => {
      // Arrange — mock blog tồn tại và có 2 comments
      const mockBlog = { id: 1, title: "Tiêu đề", content: "Nội dung" };
      const mockComments = [
        { id: 1, content: "Comment 1", user_id: 1 },
        { id: 2, content: "Comment 2", user_id: 2 },
      ];
      blogModel.findById.mockResolvedValue(mockBlog);
      blogModel.getComments.mockResolvedValue(mockComments);

      // Act
      const result = await blogService.getBlogDetail(1);

      // Assert — trả về blog kèm 2 comments
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        ...mockBlog,
        comments: mockComments,
      });
      expect(result.data.comments).toHaveLength(2);

      // CheckDB — cả findById và getComments đều được gọi đúng tham số
      expect(blogModel.findById).toHaveBeenCalledWith(1);
      expect(blogModel.getComments).toHaveBeenCalledWith(1);
    });

    // TC_BLOG_04
    test("TC_BLOG_04 — Trả về success:false khi blogId không tồn tại", async () => {
      // Arrange — mock blog không tìm thấy
      blogModel.findById.mockResolvedValue(null);

      // Act
      const result = await blogService.getBlogDetail(9999);

      // Assert — trả về không tìm thấy
      expect(result).toEqual({
        success: false,
        message: "Bài viết không tìm thấy",
        data: null,
      });

      // CheckDB — getComments KHÔNG được gọi vì blog không tồn tại
      expect(blogModel.findById).toHaveBeenCalledWith(9999);
      expect(blogModel.getComments).not.toHaveBeenCalled();
    });

    // TC_BLOG_08
    test("TC_BLOG_08 — Throw lỗi khi blogModel.findById() throw lỗi DB", async () => {
      // Arrange — mock blogModel.findById throw lỗi DB
      blogModel.findById.mockRejectedValue(new Error("DB error"));

      // Act & Assert — lỗi phải được propagate ra ngoài
      await expect(blogService.getBlogDetail(1)).rejects.toThrow("DB error");

      // CheckDB — findById được gọi với đúng blogId
      expect(blogModel.findById).toHaveBeenCalledTimes(1);
      expect(blogModel.findById).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_BLOG_09
    test("TC_BLOG_09 — Trả về comments=[] khi getComments() trả về null", async () => {
      // Arrange — blog tồn tại nhưng getComments trả về null
      const mockBlog = { id: 1, title: "Blog A", content: "Nội dung A" };
      blogModel.findById.mockResolvedValue(mockBlog);
      blogModel.getComments.mockResolvedValue(null);

      // Act
      const result = await blogService.getBlogDetail(1);

      // Assert — comments phải là mảng rỗng thay vì null (comments || [])
      expect(result.success).toBe(true);
      expect(result.data.comments).toEqual([]);

      // CheckDB — getComments được gọi với đúng blogId
      expect(blogModel.getComments).toHaveBeenCalledTimes(1);
      expect(blogModel.getComments).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── getAllBlogs() ──────────────────────────────────────────────────────────
  describe("getAllBlogs()", () => {
    // TC_BLOG_07
    test("TC_BLOG_07 — Throw lỗi khi blogModel.findAll() throw lỗi DB", async () => {
      // Arrange — mock blogModel.findAll throw lỗi DB
      blogModel.findAll.mockRejectedValue(new Error("DB error"));

      // Act & Assert — lỗi phải được propagate ra ngoài
      await expect(blogService.getAllBlogs()).rejects.toThrow("DB error");

      // CheckDB — findAll được gọi đúng 1 lần
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });
  });

  // ── searchBlogs() ──────────────────────────────────────────────────────────
  describe("searchBlogs()", () => {
    // TC_BLOG_05
    test("TC_BLOG_05 — Gọi getAllBlogs() khi keyword rỗng hoặc chỉ có khoảng trắng", async () => {
      // Arrange — mock blogModel.findAll trả về danh sách blog
      const mockBlogs = [
        { id: 1, title: "Blog 1" },
        { id: 2, title: "Blog 2" },
      ];
      blogModel.findAll.mockResolvedValue(mockBlogs);

      // Act — truyền keyword rỗng
      const result = await blogService.searchBlogs("");

      // Assert — kết quả tương đương getAllBlogs
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlogs);

      // CheckDB — findAll() được gọi, searchBlogs() KHÔNG được gọi
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);
      expect(blogModel.searchBlogs).not.toHaveBeenCalled();
    });

    // TC_BLOG_10
    test("TC_BLOG_10 — Gọi searchBlogs() và trả về kết quả khi keyword hợp lệ", async () => {
      // Arrange — mock blogModel.searchBlogs trả về danh sách kết quả
      const mockBlogs = [{ id: 1, title: "Rau củ quả" }];
      blogModel.searchBlogs.mockResolvedValue(mockBlogs);

      // Act
      const result = await blogService.searchBlogs("rau củ");

      // Assert — trả về kết quả tìm kiếm, KHÔNG gọi findAll
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlogs);

      // CheckDB — blogModel.searchBlogs() được gọi với đúng keyword
      expect(blogModel.searchBlogs).toHaveBeenCalledTimes(1);
      expect(blogModel.searchBlogs).toHaveBeenCalledWith("rau củ");

      // CheckDB — findAll() KHÔNG được gọi
      expect(blogModel.findAll).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_BLOG_11
    test("TC_BLOG_11 — Gọi getAllBlogs() khi keyword chỉ toàn khoảng trắng", async () => {
      // Arrange — mock blogModel.findAll trả về danh sách blog
      const mockBlogs = [{ id: 1, title: "Blog 1" }];
      blogModel.findAll.mockResolvedValue(mockBlogs);

      // Act — keyword chỉ toàn khoảng trắng → keyword.trim() === ""
      const result = await blogService.searchBlogs("   ");

      // Assert — fallback về getAllBlogs
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlogs);

      // CheckDB — findAll() được gọi, searchBlogs() KHÔNG được gọi
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);
      expect(blogModel.searchBlogs).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_BLOG_12
    test("TC_BLOG_12 — Gọi getAllBlogs() khi keyword là null", async () => {
      // Arrange — mock blogModel.findAll trả về danh sách blog
      const mockBlogs = [{ id: 2, title: "Blog 2" }];
      blogModel.findAll.mockResolvedValue(mockBlogs);

      // Act — keyword là null → !keyword === true → fallback về getAllBlogs
      const result = await blogService.searchBlogs(null);

      // Assert — fallback về getAllBlogs
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBlogs);

      // CheckDB — findAll() được gọi, searchBlogs() KHÔNG được gọi
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);
      expect(blogModel.searchBlogs).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });
  });

  // ── updateBlog() ───────────────────────────────────────────────────────────
  describe("updateBlog()", () => {
    // TC_BLOG_14
    test("TC_BLOG_14 — Trả về success:false khi title bị bỏ trống trong updateBlog", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB
      const blogData = { title: "", content: "Nội dung" };

      // Act
      const result = await blogService.updateBlog(1, blogData);

      // Assert — trả về lỗi validation khi title bỏ trống
      expect(result).toEqual({
        success: false,
        message: "Tiêu đề và nội dung bài viết không được trống",
        data: null,
      });

      // CheckDB — blogModel.update() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.update).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });

    // TC_BLOG_15
    test("TC_BLOG_15 — Trả về success:false khi content bị bỏ trống trong updateBlog", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB
      const blogData = { title: "Tiêu đề", content: "" };

      // Act
      const result = await blogService.updateBlog(1, blogData);

      // Assert — trả về lỗi validation khi content bỏ trống
      expect(result).toEqual({
        success: false,
        message: "Tiêu đề và nội dung bài viết không được trống",
        data: null,
      });

      // CheckDB — blogModel.update() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.update).not.toHaveBeenCalled();

      // Rollback: dùng mock => không cần rollback
    });

    // TC_BLOG_16
    test("TC_BLOG_16 — Cập nhật bài viết thành công khi blogData hợp lệ", async () => {
      // Arrange — mock blogModel.update trả về blog đã được cập nhật
      const blogData = { title: "Tiêu đề mới", content: "Nội dung mới" };
      const mockUpdatedBlog = {
        id: 1,
        title: "Tiêu đề mới",
        content: "Nội dung mới",
      };
      blogModel.update.mockResolvedValue(mockUpdatedBlog);

      // Act
      const result = await blogService.updateBlog(1, blogData);

      // Assert — trả về thành công kèm blog đã cập nhật
      expect(result).toEqual({
        success: true,
        data: mockUpdatedBlog,
        message: "Cập nhật bài viết thành công",
      });

      // CheckDB — blogModel.update() được gọi đúng 1 lần với đúng tham số
      expect(blogModel.update).toHaveBeenCalledTimes(1);
      expect(blogModel.update).toHaveBeenCalledWith(1, blogData);

      // Rollback: dùng mock => không có dữ liệu thật nào bị thay đổi => không cần rollback
    });
  });

  // ── deleteBlog() ───────────────────────────────────────────────────────────
  describe("deleteBlog()", () => {
    // TC_BLOG_17
    test("TC_BLOG_17 — Trả về success:true khi xóa bài viết thành công", async () => {
      // Arrange — mock blogModel.remove trả về true
      blogModel.remove.mockResolvedValue(true);

      // Act
      const result = await blogService.deleteBlog(1);

      // Assert — trả về success:true kèm message xóa thành công
      expect(result).toEqual({
        success: true,
        message: "Xóa bài viết thành công",
        data: null,
      });

      // CheckDB — blogModel.remove() được gọi đúng 1 lần với đúng blogId
      expect(blogModel.remove).toHaveBeenCalledTimes(1);
      expect(blogModel.remove).toHaveBeenCalledWith(1);

      // Rollback: dùng mock => không có dữ liệu thật nào bị xóa => không cần rollback
    });

    // TC_BLOG_18
    test("TC_BLOG_18 — Trả về success:false khi xóa bài viết thất bại", async () => {
      // Arrange — mock blogModel.remove trả về false (không có bài viết nào bị xóa)
      blogModel.remove.mockResolvedValue(false);

      // Act
      const result = await blogService.deleteBlog(9999);

      // Assert — trả về success:false kèm message xóa thất bại
      expect(result).toEqual({
        success: false,
        message: "Xóa bài viết thất bại",
        data: null,
      });

      // CheckDB — blogModel.remove() được gọi đúng 1 lần với đúng blogId
      expect(blogModel.remove).toHaveBeenCalledTimes(1);
      expect(blogModel.remove).toHaveBeenCalledWith(9999);

      // Rollback: dùng mock => không cần rollback
    });
  });

  // ── addComment() ───────────────────────────────────────────────────────────
  describe("addComment()", () => {
    // TC_BLOG_06
    test("TC_BLOG_06 — Trả về success:false khi nội dung comment trống", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB

      // Act
      const result = await blogService.addComment(1, 1, "");

      // Assert — trả về lỗi validation
      expect(result).toEqual({
        success: false,
        message: "Nội dung comment không được trống",
        data: null,
      });

      // CheckDB — blogModel.addComment() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.addComment).not.toHaveBeenCalled();
    });

    // TC_BLOG_19
    test("TC_BLOG_19 — Thêm comment thành công khi content hợp lệ", async () => {
      // Arrange — mock blogModel.addComment trả về comment object
      const mockComment = {
        id: 10,
        blog_id: 1,
        user_id: 2,
        content: "Bài viết hay quá!",
      };
      blogModel.addComment.mockResolvedValue(mockComment);

      // Act
      const result = await blogService.addComment(1, 2, "Bài viết hay quá!");

      // Assert — trả về thành công kèm comment vừa tạo
      expect(result).toEqual({
        success: true,
        data: mockComment,
        message: "Thêm comment thành công",
      });

      // CheckDB — blogModel.addComment() được gọi đúng 1 lần với đúng tham số
      expect(blogModel.addComment).toHaveBeenCalledTimes(1);
      expect(blogModel.addComment).toHaveBeenCalledWith(
        1,
        2,
        "Bài viết hay quá!",
      );

      // Rollback: dùng mock => không có dữ liệu thật nào được tạo => không cần rollback
    });

    // TC_BLOG_20
    test("TC_BLOG_20 — Trả về success:false khi content comment chỉ toàn khoảng trắng", async () => {
      // Arrange — không cần mock vì validation chặn trước khi gọi DB
      // content.trim() === "" khi chỉ có khoảng trắng

      // Act
      const result = await blogService.addComment(1, 2, "   ");

      // Assert — trả về lỗi validation khi content toàn khoảng trắng
      expect(result).toEqual({
        success: false,
        message: "Nội dung comment không được trống",
        data: null,
      });

      // CheckDB — blogModel.addComment() KHÔNG được gọi vì bị chặn bởi validation
      expect(blogModel.addComment).not.toHaveBeenCalled();

      // Rollback: dùng mock => không có dữ liệu thật nào được tạo => không cần rollback
    });
  });

  // ── getAllBlogs() — happy path ───────────────────────────────────────────
  describe("getAllBlogs() — happy path", () => {
    // TC_BLOG_21
    test("TC_BLOG_21 — Trả về success:true kèm danh sách blogs", async () => {
      // Arrange
      const mockBlogs = [
        { id: 1, title: "Blog 1", content: "Nội dung 1" },
        { id: 2, title: "Blog 2", content: "Nội dung 2" },
      ];
      blogModel.findAll.mockResolvedValue(mockBlogs);

      // Act
      const result = await blogService.getAllBlogs();

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockBlogs,
        message: "Lấy danh sách bài viết thành công",
      });
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);
    });

    // TC_BLOG_22
    test("TC_BLOG_22 — Trả về data=[] khi findAll trả về null", async () => {
      // Arrange — mock trả về null (blogs || [] → [])
      blogModel.findAll.mockResolvedValue(null);

      // Act
      const result = await blogService.getAllBlogs();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(blogModel.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── getBlogsByCategory() ──────────────────────────────────────────────────
  describe("getBlogsByCategory()", () => {
    // TC_BLOG_23
    test("TC_BLOG_23 — Trả về blogs theo danh mục khi category hợp lệ", async () => {
      // Arrange
      const mockBlogs = [
        { id: 1, title: "Blog A", category: "sức khỏe" },
        { id: 2, title: "Blog B", category: "sức khỏe" },
      ];
      blogModel.findByCategory.mockResolvedValue(mockBlogs);

      // Act
      const result = await blogService.getBlogsByCategory("sức khỏe");

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockBlogs,
        message: "Lấy bài viết theo danh mục thành công",
      });
      expect(blogModel.findByCategory).toHaveBeenCalledTimes(1);
      expect(blogModel.findByCategory).toHaveBeenCalledWith("sức khỏe");
    });

    // TC_BLOG_24
    test("TC_BLOG_24 — Trả về data=[] khi không có blogs trong danh mục", async () => {
      // Arrange — mock trả về null (blogs || [] → [])
      blogModel.findByCategory.mockResolvedValue(null);

      // Act
      const result = await blogService.getBlogsByCategory("không tồn tại");

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(blogModel.findByCategory).toHaveBeenCalledWith("không tồn tại");
    });

    // TC_BLOG_25
    test("TC_BLOG_25 — Throw lỗi khi model throw lỗi DB trong getBlogsByCategory", async () => {
      // Arrange
      blogModel.findByCategory.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(blogService.getBlogsByCategory("sức khỏe")).rejects.toThrow(
        "DB error",
      );
      expect(blogModel.findByCategory).toHaveBeenCalledTimes(1);
    });
  });

  // ── getAllBlogsAdmin() ────────────────────────────────────────────────────
  describe("getAllBlogsAdmin()", () => {
    // TC_BLOG_26
    test("TC_BLOG_26 — Trả về tất cả blogs kể cả draft khi gọi getAllBlogsAdmin", async () => {
      // Arrange
      const mockBlogs = [
        { id: 1, title: "Blog published", status: "published" },
        { id: 2, title: "Blog draft", status: "draft" },
      ];
      blogModel.findAllAdmin.mockResolvedValue(mockBlogs);

      // Act
      const result = await blogService.getAllBlogsAdmin();

      // Assert
      expect(result).toEqual({
        success: true,
        data: mockBlogs,
        message: "Lấy danh sách bài viết thành công",
      });
      expect(blogModel.findAllAdmin).toHaveBeenCalledTimes(1);
    });

    // TC_BLOG_27
    test("TC_BLOG_27 — Trả về data=[] khi findAllAdmin trả về null", async () => {
      // Arrange — mock trả về null (blogs || [] → [])
      blogModel.findAllAdmin.mockResolvedValue(null);

      // Act
      const result = await blogService.getAllBlogsAdmin();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(blogModel.findAllAdmin).toHaveBeenCalledTimes(1);
    });

    // TC_BLOG_28
    test("TC_BLOG_28 — Throw lỗi khi model throw lỗi DB trong getAllBlogsAdmin", async () => {
      // Arrange
      blogModel.findAllAdmin.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(blogService.getAllBlogsAdmin()).rejects.toThrow("DB error");
      expect(blogModel.findAllAdmin).toHaveBeenCalledTimes(1);
    });
  });

  // ── error paths còn thiếu ─────────────────────────────────────────────────
  describe("searchBlogs() — error path", () => {
    // TC_BLOG_29
    test("TC_BLOG_29 — Throw lỗi khi model throw lỗi DB trong searchBlogs", async () => {
      // Arrange
      blogModel.searchBlogs.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(blogService.searchBlogs("từ khóa")).rejects.toThrow(
        "DB error",
      );
      expect(blogModel.searchBlogs).toHaveBeenCalledTimes(1);
      expect(blogModel.searchBlogs).toHaveBeenCalledWith("từ khóa");
    });
  });

  describe("createBlog() — error path", () => {
    // TC_BLOG_30
    test("TC_BLOG_30 — Throw lỗi khi model throw lỗi DB trong createBlog", async () => {
      // Arrange
      blogModel.create.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(
        blogService.createBlog({ title: "Tiêu đề", content: "Nội dung" }),
      ).rejects.toThrow("DB error");
      expect(blogModel.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateBlog() — error path", () => {
    // TC_BLOG_31
    test("TC_BLOG_31 — Throw lỗi khi model throw lỗi DB trong updateBlog", async () => {
      // Arrange
      blogModel.update.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(
        blogService.updateBlog(1, { title: "Tiêu đề", content: "Nội dung" }),
      ).rejects.toThrow("DB error");
      expect(blogModel.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteBlog() — error path", () => {
    // TC_BLOG_32
    test("TC_BLOG_32 — Throw lỗi khi model throw lỗi DB trong deleteBlog", async () => {
      // Arrange
      blogModel.remove.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(blogService.deleteBlog(1)).rejects.toThrow("DB error");
      expect(blogModel.remove).toHaveBeenCalledTimes(1);
      expect(blogModel.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("addComment() — error path", () => {
    // TC_BLOG_33
    test("TC_BLOG_33 — Throw lỗi khi model throw lỗi DB trong addComment", async () => {
      // Arrange
      blogModel.addComment.mockRejectedValue(new Error("DB error"));

      // Act & Assert
      await expect(
        blogService.addComment(1, 1, "Nội dung comment"),
      ).rejects.toThrow("DB error");
      expect(blogModel.addComment).toHaveBeenCalledTimes(1);
      expect(blogModel.addComment).toHaveBeenCalledWith(
        1,
        1,
        "Nội dung comment",
      );
    });
  });
});

// ─── searchBlogs khi model trả về null ──────────────────────
describe("searchBlogs() — blogs null branch", () => {
  // TC_BLOG_34
  test("TC_BLOG_34 — Trả về data=[] khi searchBlogs model trả về null", async () => {
    // Arrange — mock trả về null (blogs || [] → [])
    blogModel.searchBlogs.mockResolvedValue(null);

    // Act
    const result = await blogService.searchBlogs("từ khóa");

    // Assert — data phải là [] thay vì null
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(blogModel.searchBlogs).toHaveBeenCalledWith("từ khóa");
  });
});

// ── Negative test cases ───────────────────────────────────────────────
describe("createBlog() — thiếu hoặc sai kiểu dữ liệu", () => {
  // TC_BLOG_35
  test("TC_BLOG_35 — Trả về success:false khi title là null (không phải chuỗi rỗng)", async () => {
    // title=null → !blogData.title = true → bị chặn validation, không gọi DB
    const result = await blogService.createBlog({
      title: null,
      content: "Nội dung",
    });

    expect(result).toEqual({
      success: false,
      message: "Tiêu đề và nội dung bài viết không được trống",
      data: null,
    });
    expect(blogModel.create).not.toHaveBeenCalled();
  });

  // TC_BLOG_36
  test("TC_BLOG_36 — Trả về success:false khi content là null", async () => {
    // content=null → !blogData.content = true → bị chặn validation
    const result = await blogService.createBlog({
      title: "Tiêu đề",
      content: null,
    });

    expect(result).toEqual({
      success: false,
      message: "Tiêu đề và nội dung bài viết không được trống",
      data: null,
    });
    expect(blogModel.create).not.toHaveBeenCalled();
  });
});

describe("updateBlog() — thiếu hoặc sai kiểu dữ liệu", () => {
  // TC_BLOG_37
  test("TC_BLOG_37 — Trả về success:false khi title là null trong updateBlog", async () => {
    const result = await blogService.updateBlog(1, {
      title: null,
      content: "Nội dung",
    });

    expect(result).toEqual({
      success: false,
      message: "Tiêu đề và nội dung bài viết không được trống",
      data: null,
    });
    expect(blogModel.update).not.toHaveBeenCalled();
  });

  // TC_BLOG_38
  test("TC_BLOG_38 — Trả về success:false khi cả title lẫn content đều undefined", async () => {
    // Không truyền title/content → undefined → !undefined = true → bị chặn
    const result = await blogService.updateBlog(1, {});

    expect(result).toEqual({
      success: false,
      message: "Tiêu đề và nội dung bài viết không được trống",
      data: null,
    });
    expect(blogModel.update).not.toHaveBeenCalled();
  });
});

describe("addComment() — nội dung không hợp lệ", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC_BLOG_39
  test("TC_BLOG_39 — Trả về success:false khi content là null", async () => {
    // content=null → !content = true → bị chặn validation
    const result = await blogService.addComment(1, 1, null);

    expect(result).toEqual({
      success: false,
      message: "Nội dung comment không được trống",
      data: null,
    });
    expect(blogModel.addComment).not.toHaveBeenCalled();
  });
});

const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Mock các thư viện bên ngoài để không gọi API thực tế
jest.mock("chromadb");
jest.mock("@google/generative-ai");

// Mock các model database để tránh kết nối đến DB thật
jest.mock("../models/index.js", () => ({
  productModel: {
    findByIdWithVariants: jest.fn()
  },
  blogModel: {
    findById: jest.fn()
  }
}));

// Mock hàm xử lý text để đơn giản hóa quá trình test
jest.mock("../rag/scripts/textNormalization.js", () => ({
  normalizeText: jest.fn((text) => text ? String(text).toLowerCase().trim() : "")
}));

describe("RAG Service", () => {
  let ragService;
  let mockGetCollection;
  let mockUpsert;
  let mockDelete;
  let mockEmbedContent;
  let productModel;
  let blogModel;

  beforeEach(() => {
    // Xóa tất cả các trạng thái của mock trước mỗi test
    jest.clearAllMocks();
    
    // Reset module cache để các biến toàn cục trong ragService (như chromaClient) được tạo mới
    jest.resetModules();

    productModel = require("../models/index.js").productModel;
    blogModel = require("../models/index.js").blogModel;

    // Giả lập các hàm của ChromaDB
    mockUpsert = jest.fn().mockResolvedValue(true);
    mockDelete = jest.fn().mockResolvedValue(true);
    mockGetCollection = jest.fn().mockResolvedValue({
      upsert: mockUpsert,
      delete: mockDelete
    });

    const chromadb = require("chromadb");
    chromadb.ChromaClient.mockImplementation(() => ({
      getCollection: mockGetCollection
    }));

    // Giả lập hàm tạo embedding của Google Generative AI (Gemini) trả về mảng vector mặc định
    mockEmbedContent = jest.fn().mockResolvedValue({
      embedding: { values: [0.1, 0.2, 0.3] }
    });

    const genAI = require("@google/generative-ai");
    genAI.GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        embedContent: mockEmbedContent
      })
    }));

    process.env.GEMINI_API_KEY = "test_api_key";
    
    // Vô hiệu hóa console.log và console.error để log không bị lộn xộn khi chạy test
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    ragService = require("../services/ragService.js");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Hàm updateProductInRAG", () => {
    it("nên trả về false nếu kết nối Chroma thất bại", async () => {
      // Giả lập lỗi khi lấy collection từ ChromaDB
      mockGetCollection.mockRejectedValueOnce(new Error("Lỗi kết nối"));
      const result = await ragService.updateProductInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên trả về false nếu không tìm thấy sản phẩm trong DB", async () => {
      // Giả lập DB không trả về sản phẩm nào
      productModel.findByIdWithVariants.mockResolvedValue(null);
      const result = await ragService.updateProductInRAG(1);
      
      expect(result).toBe(false);
      expect(productModel.findByIdWithVariants).toHaveBeenCalledWith(1);
    });

    it("nên trả về false nếu tạo embedding thất bại", async () => {
      const mockProduct = { id: 1, name: "Product" };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);
      
      // Giả lập Gemini gọi API lỗi
      mockEmbedContent.mockRejectedValueOnce(new Error("Lỗi tạo embedding"));
      const result = await ragService.updateProductInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên trả về false nếu gặp lỗi từ Database khi truy vấn sản phẩm", async () => {
      // Giả lập DB quăng lỗi
      productModel.findByIdWithVariants.mockRejectedValueOnce(new Error("Lỗi DB"));
      const result = await ragService.updateProductInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên trả về false nếu gặp lỗi khi ChromaDB thực hiện upsert sản phẩm", async () => {
      const mockProduct = { id: 1, name: "Product" };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);
      
      // Giả lập lỗi khi tiến hành lưu (upsert) vào ChromaDB
      mockUpsert.mockRejectedValueOnce(new Error("Lỗi lưu Chroma"));
      const result = await ragService.updateProductInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên cập nhật thành công sản phẩm cùng với các biến thể (variants) vào RAG", async () => {
      // Dữ liệu sản phẩm giả lập từ DB
      const mockProduct = {
        id: 1,
        name: "Test Product",
        category_id: 2,
        category: "Electronics",
        supplier: "Tech Corp",
        origin: "USA",
        description: "A test product",
        variants: [
          { price_sale: "1,000.00", stock: 10, unit: "box" }
        ]
      };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);

      const result = await ragService.updateProductInRAG(1);

      expect(result).toBe(true);
      expect(productModel.findByIdWithVariants).toHaveBeenCalledWith(1);
      expect(mockEmbedContent).toHaveBeenCalled();
      
      // Kiểm tra xem dữ liệu được đẩy vào ChromaDB có đúng cấu trúc hay không
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        ids: ["product:1"],
        embeddings: [[0.1, 0.2, 0.3]],
        metadatas: [expect.objectContaining({
          type: "product",
          id: "1",
          name: "Test Product"
        })]
      }));
    });

    it("nên xử lý biến thể (variants) của sản phẩm ở định dạng JSON string", async () => {
      const mockProduct = {
        id: 2,
        name: "String Variant Product",
        variants: JSON.stringify([{ price_sale: "500", stock: 5, unit: "pcs" }])
      };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);

      const result = await ragService.updateProductInRAG(2);

      // Cần xử lý thành công vì service có hàm parse JSON
      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it("nên xử lý êm xuôi lỗi nếu biến thể (variants) là JSON không hợp lệ", async () => {
      const mockProduct = {
        id: 3,
        name: "Bad Variant Product",
        variants: "invalid_json"
      };
      productModel.findByIdWithVariants.mockResolvedValue(mockProduct);

      const result = await ragService.updateProductInRAG(3);

      // Không throw error, vẫn thực hiện upsert với mảng variant rỗng
      expect(result).toBe(true);
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe("Hàm updateBlogInRAG", () => {
    it("nên trả về false nếu kết nối Chroma thất bại", async () => {
      mockGetCollection.mockRejectedValueOnce(new Error("Lỗi kết nối"));
      const result = await ragService.updateBlogInRAG(1);
      expect(result).toBe(false);
    });

    it("nên trả về false nếu không tìm thấy bài viết (blog) trong DB", async () => {
      blogModel.findById.mockResolvedValue(null);
      const result = await ragService.updateBlogInRAG(1);
      expect(result).toBe(false);
      expect(blogModel.findById).toHaveBeenCalledWith(1);
    });

    it("nên trả về false nếu tạo embedding cho bài viết thất bại", async () => {
      const mockBlog = { id: 1, title: "Blog" };
      blogModel.findById.mockResolvedValue(mockBlog);
      
      mockEmbedContent.mockRejectedValueOnce(new Error("Lỗi tạo embedding"));
      const result = await ragService.updateBlogInRAG(1);
      expect(result).toBe(false);
    });

    it("nên trả về false nếu gặp lỗi từ Database khi truy vấn bài viết", async () => {
      blogModel.findById.mockRejectedValueOnce(new Error("Lỗi DB"));
      const result = await ragService.updateBlogInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên trả về false nếu gặp lỗi khi ChromaDB thực hiện upsert bài viết", async () => {
      const mockBlog = { id: 1, title: "Blog" };
      blogModel.findById.mockResolvedValue(mockBlog);
      
      mockUpsert.mockRejectedValueOnce(new Error("Lỗi lưu Chroma"));
      const result = await ragService.updateBlogInRAG(1);
      
      expect(result).toBe(false);
    });

    it("nên cập nhật thành công bài viết vào RAG", async () => {
      // Dữ liệu bài viết giả lập
      const mockBlog = {
        id: 1,
        title: "Test Blog",
        content: "Test blog content",
        created_at: "2023-01-01T00:00:00Z"
      };
      blogModel.findById.mockResolvedValue(mockBlog);

      const result = await ragService.updateBlogInRAG(1);

      expect(result).toBe(true);
      expect(blogModel.findById).toHaveBeenCalledWith(1);
      expect(mockEmbedContent).toHaveBeenCalled();
      
      // Kiểm tra dữ liệu đẩy vào ChromaDB có đúng prefix blog:id không
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        ids: ["blog:1"],
        embeddings: [[0.1, 0.2, 0.3]],
        metadatas: [expect.objectContaining({
          type: "blog",
          id: "1",
          title: "Test Blog"
        })]
      }));
    });
  });

  describe("Hàm deleteProductFromRAG", () => {
    it("nên trả về false nếu kết nối Chroma không khả dụng", async () => {
      mockGetCollection.mockRejectedValueOnce(new Error("Lỗi kết nối"));
      const result = await ragService.deleteProductFromRAG(1);
      expect(result).toBe(false);
    });

    it("nên xóa thành công một sản phẩm khỏi Chroma", async () => {
      const result = await ragService.deleteProductFromRAG(1);
      expect(result).toBe(true);
      
      // Kiểm tra phương thức delete được gọi với ID tương ứng
      expect(mockDelete).toHaveBeenCalledWith({
        ids: ["product:1"]
      });
    });

    it("nên trả về false nếu việc xóa gặp lỗi từ Chroma", async () => {
      mockDelete.mockRejectedValueOnce(new Error("Lỗi xóa"));
      const result = await ragService.deleteProductFromRAG(1);
      expect(result).toBe(false);
    });
  });

  describe("Hàm deleteBlogFromRAG", () => {
    it("nên trả về false nếu kết nối Chroma không khả dụng", async () => {
      mockGetCollection.mockRejectedValueOnce(new Error("Lỗi kết nối"));
      const result = await ragService.deleteBlogFromRAG(1);
      expect(result).toBe(false);
    });

    it("nên xóa thành công một bài viết khỏi Chroma", async () => {
      const result = await ragService.deleteBlogFromRAG(1);
      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith({
        ids: ["blog:1"]
      });
    });

    it("nên trả về false nếu việc xóa gặp lỗi từ Chroma", async () => {
      mockDelete.mockRejectedValueOnce(new Error("Lỗi xóa"));
      const result = await ragService.deleteBlogFromRAG(1);
      expect(result).toBe(false);
    });
  });

  describe("Các hàm xử lý RAG() — dữ liệu không hợp lệ (service không validate)", () => {
    it("TC_RAG_01 — Vẫn chạy và trả về false khi productId là null/undefined do DB trả về null — service không validate", async () => {
      productModel.findByIdWithVariants.mockResolvedValue(null);
      
      const result = await ragService.updateProductInRAG(null);
      
      expect(result).toBe(false);
      expect(productModel.findByIdWithVariants).toHaveBeenCalledWith(null);
    });

    it("TC_RAG_02 — Vẫn chạy và trả về false khi blogId là rỗng do DB trả về null — service không validate", async () => {
      blogModel.findById.mockResolvedValue(null);
      
      const result = await ragService.updateBlogInRAG("");
      
      expect(result).toBe(false);
      expect(blogModel.findById).toHaveBeenCalledWith("");
    });
  });

  describe("Các hàm xử lý RAG() — service phải validate dữ liệu đầu vào", () => {
    it("TC_RAG_03 — Phải throw lỗi khi productId không hợp lệ trong updateProductInRAG — service CHƯA validate", async () => {
      // Test FAIL vì service chưa có validation này và đang tự bắt lỗi trả về false
      // Cần sửa trong service: thêm if (!productId) throw new Error("Invalid productId") và không catch lỗi validation
      await expect(ragService.updateProductInRAG(null)).rejects.toThrow("Invalid productId");
    });

    it("TC_RAG_04 — Phải throw lỗi khi blogId không hợp lệ trong updateBlogInRAG — service CHƯA validate", async () => {
      // Test FAIL vì service chưa có validation này
      await expect(ragService.updateBlogInRAG(undefined)).rejects.toThrow("Invalid blogId");
    });

    it("TC_RAG_05 — Phải throw lỗi khi productId không hợp lệ trong deleteProductFromRAG — service CHƯA validate", async () => {
      // Test FAIL vì service chưa có validation này
      await expect(ragService.deleteProductFromRAG("")).rejects.toThrow("Invalid productId");
    });

    it("TC_RAG_06 — Phải throw lỗi khi blogId không hợp lệ trong deleteBlogFromRAG — service CHƯA validate", async () => {
      // Test FAIL vì service chưa có validation này
      await expect(ragService.deleteBlogFromRAG(null)).rejects.toThrow("Invalid blogId");
    });
  });

  describe("Coverage test cho các nhánh phụ (để đạt 100% Branch Coverage)", () => {
    beforeEach(() => {
      jest.resetModules();
      
      // Khai báo biến môi trường tồn tại để cover nhánh (process.env.CHROMA_HOST || "localhost")
      process.env.CHROMA_HOST = "custom-host";
      process.env.CHROMA_PORT = "9000";
      
      const chromadb = require("chromadb");
      chromadb.ChromaClient.mockImplementation(() => ({
        getCollection: jest.fn().mockResolvedValue({
          upsert: jest.fn().mockResolvedValue(true),
          delete: jest.fn().mockResolvedValue(true)
        })
      }));

      const genAI = require("@google/generative-ai");
      genAI.GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          embedContent: jest.fn().mockResolvedValue({
            embedding: { values: [0.1, 0.2, 0.3] }
          })
        })
      }));
      
      ragService = require("../services/ragService.js");
    });

    it("TC_RAG_07 — Cover nhánh initChroma khi client đã tồn tại và xử lý missing data trong product/variants", async () => {
      const mockProduct = {
        id: 999,
        // Cố tình bỏ trống name, category, supplier, origin, description
        // để trigger nhánh fallback (|| "") trong buildCleanProductText
        variants: [
          {} // Biến thể rỗng để trigger nhánh fallback (v.price_sale || 0, v.stock || "0", v.unit || "unit")
        ]
      };
      
      const pm = require("../models/index.js").productModel;
      pm.findByIdWithVariants.mockResolvedValue(mockProduct);
      
      // Gọi lần 1 để khởi tạo chromaClient
      await ragService.updateProductInRAG(999);
      
      // Gọi lần 2 để cover nhánh if (!chromaClient) sẽ trả về false (nhảy qua đoạn init)
      const result = await ragService.updateProductInRAG(999);
      expect(result).toBe(true);
    });

    it("TC_RAG_08 — Cover nhánh buildCleanBlogText với blog missing data", async () => {
      const mockBlog = {
        id: 888,
        // Cố tình bỏ trống title, content, created_at
      };
      const bm = require("../models/index.js").blogModel;
      bm.findById.mockResolvedValue(mockBlog);
      
      const result = await ragService.updateBlogInRAG(888);
      expect(result).toBe(true);
    });

    it("TC_RAG_09 — Cover nhánh typeof product.variants không phải là array hay string", async () => {
      const mockProduct = {
        id: 777,
        name: "Test",
        variants: 12345 // Không phải mảng cũng không phải chuỗi
      };
      const pm = require("../models/index.js").productModel;
      pm.findByIdWithVariants.mockResolvedValue(mockProduct);
      
      const result = await ragService.updateProductInRAG(777);
      expect(result).toBe(true);
    });

    it("TC_RAG_10 — Cover nhánh dòng 121 khi variants là chuỗi rỗng", async () => {
      const mockProduct = {
        id: 777,
        name: "Test",
        variants: "" // Là chuỗi nhưng rỗng, sẽ trigger nhánh (product.variants || "[]")
      };
      const pm = require("../models/index.js").productModel;
      pm.findByIdWithVariants.mockResolvedValue(mockProduct);
      
      const result = await ragService.updateProductInRAG(777);
      expect(result).toBe(true);
    });
  });
});

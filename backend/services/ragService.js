const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { normalizeText } = require("../rag/scripts/textNormalization.js");
const { productModel, blogModel } = require("../models/index.js");

const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || "8000");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let chromaClient = null;
let chromaCollection = null;

// Initialize Chroma connection
async function initChroma() {
  try {
    if (!chromaClient) {
      chromaClient = new ChromaClient({
        host: CHROMA_HOST,
        port: CHROMA_PORT,
      });
      chromaCollection = await chromaClient.getCollection({
        name: "rag_products",
      });
      console.log("[RAG Service] Chroma connected");
    }
  } catch (err) {
    console.error("[RAG Service] Chroma init failed:", err.message);
    chromaClient = null;
    chromaCollection = null;
  }
}

// Get embedding from Gemini
async function getEmbedding(text) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const res = await model.embedContent(text);
    return res.embedding.values;
  } catch (err) {
    console.error("[RAG Service] Embedding error:", err.message);
    return null;
  }
}

// Build clean product text (same as prepareRAGData)
function buildCleanProductText(product) {
  if (!product) return "";

  const name = normalizeText(product.name);
  const category = normalizeText(product.category || "");
  const supplier = normalizeText(product.supplier || "");
  const origin = normalizeText(product.origin || "");

  let description = "";
  if (product.description) {
    description = normalizeText(product.description).substring(0, 300).trim();
  }

  const parts = [
    name,
    category && `danh muc ${category}`,
    supplier && `nha cung cap ${supplier}`,
    origin && `xuat xu ${origin}`,
    description && `mo ta ${description}`,
  ].filter(Boolean);

  // Add all variants with their prices and stock
  const variants = product.variants || [];
  if (variants.length > 0) {
    const variantTexts = variants
      .map((v, idx) => {
        const price = String(v.price_sale || 0)
          .replace(/[.,]/g, "")
          .replace(/,/g, ".");
        const stock = v.stock || "0";
        const unit = (v.unit || "unit").toLowerCase();
        return `variant ${idx + 1} gia ${price} ton kho ${stock} don vi ${unit}`;
      })
      .filter(Boolean);
    parts.push(...variantTexts);
  }

  return parts.join(" ");
}

// Build clean blog text (same as prepareRAGData)
function buildCleanBlogText(blog) {
  if (!blog) return "";

  const normalizedTitle = normalizeText(blog.title);
  const normalizedContent = normalizeText(blog.content);
  return `${normalizedTitle}\n\n${normalizedContent}`;
}

// Update or insert product in Chroma
async function updateProductInRAG(productId) {
  try {
    await initChroma();

    if (!chromaCollection) {
      console.log(
        "[RAG Service] Chroma not available, skip product RAG update",
      );
      return false;
    }

    // Fetch product from DB
    const product = await productModel.findByIdWithVariants(productId);
    if (!product) {
      console.log(`[RAG Service] Product ${productId} not found`);
      return false;
    }

    // Parse variants
    let variants = [];
    try {
      if (Array.isArray(product.variants)) {
        variants = product.variants;
      } else if (typeof product.variants === "string") {
        variants = JSON.parse(product.variants || "[]");
      }
    } catch {
      variants = [];
    }

    // Build normalized text
    const text = buildCleanProductText({
      ...product,
      variants,
    });

    // Get embedding
    const embedding = await getEmbedding(text);
    if (!embedding) {
      console.error(`[RAG Service] Failed to embed product ${productId}`);
      return false;
    }

    // Prepare metadata (only primitive types allowed by Chroma)
    const metadata = {
      type: "product",
      source: "products",
      id: String(productId),
      name: String(product.name || "").substring(0, 100),
      category: String(product.category_id || "N/A").substring(0, 100),
    };

    const docId = `product:${productId}`;

    // Upsert to Chroma
    await chromaCollection.upsert({
      ids: [docId],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [text],
    });

    console.log(`[RAG Service] ✓ Updated product ${productId} in Chroma`);
    return true;
  } catch (err) {
    console.error("[RAG Service] updateProductInRAG error:", err.message);
    return false;
  }
}

// Update or insert blog in Chroma
async function updateBlogInRAG(blogId) {
  try {
    await initChroma();

    if (!chromaCollection) {
      console.log("[RAG Service] Chroma not available, skip blog RAG update");
      return false;
    }

    // Fetch blog from DB
    const blog = await blogModel.findById(blogId);
    if (!blog) {
      console.log(`[RAG Service] Blog ${blogId} not found`);
      return false;
    }

    // Build normalized text
    const text = buildCleanBlogText(blog);

    // Get embedding
    const embedding = await getEmbedding(text);
    if (!embedding) {
      console.error(`[RAG Service] Failed to embed blog ${blogId}`);
      return false;
    }

    // Prepare metadata (only primitive types allowed by Chroma)
    const metadata = {
      type: "blog",
      source: "blogs",
      id: String(blogId),
      title: String(blog.title || "").substring(0, 100),
      created_at: blog.created_at
        ? new Date(blog.created_at).toISOString()
        : "",
    };

    const docId = `blog:${blogId}`;

    // Upsert to Chroma (for main blog doc)
    await chromaCollection.upsert({
      ids: [docId],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [text],
    });

    console.log(`[RAG Service] ✓ Updated blog ${blogId} in Chroma`);
    return true;
  } catch (err) {
    console.error("[RAG Service] updateBlogInRAG error:", err.message);
    return false;
  }
}

// Delete product from Chroma
async function deleteProductFromRAG(productId) {
  try {
    await initChroma();

    if (!chromaCollection) {
      console.log("[RAG Service] Chroma not available, skip product deletion");
      return false;
    }

    const docId = `product:${productId}`;
    await chromaCollection.delete({
      ids: [docId],
    });

    console.log(`[RAG Service] ✓ Deleted product ${productId} from Chroma`);
    return true;
  } catch (err) {
    console.error("[RAG Service] deleteProductFromRAG error:", err.message);
    return false;
  }
}

// Delete blog from Chroma
async function deleteBlogFromRAG(blogId) {
  try {
    await initChroma();

    if (!chromaCollection) {
      console.log("[RAG Service] Chroma not available, skip blog deletion");
      return false;
    }

    const docId = `blog:${blogId}`;
    await chromaCollection.delete({
      ids: [docId],
    });

    console.log(`[RAG Service] ✓ Deleted blog ${blogId} from Chroma`);
    return true;
  } catch (err) {
    console.error("[RAG Service] deleteBlogFromRAG error:", err.message);
    return false;
  }
}

module.exports = {
  updateProductInRAG,
  updateBlogInRAG,
  deleteProductFromRAG,
  deleteBlogFromRAG,
};

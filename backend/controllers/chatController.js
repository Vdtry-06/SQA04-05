const { GoogleGenAI } = require("@google/genai");
const rateLimit = require("express-rate-limit");
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { normalizeText } = require("../rag/scripts/textNormalization");
const { productModel } = require("../models");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const CHROMA_HOST = process.env.CHROMA_HOST || "localhost";
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || "8000");

// rate limit
const chatRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, slow down." },
});

// Chroma client (v2)
let chromaClient = null;
let chromaCollection = null;

async function initChroma() {
  try {
    chromaClient = new ChromaClient({
      host: CHROMA_HOST,
      port: CHROMA_PORT,
    });
    chromaCollection = await chromaClient.getCollection({
      name: "rag_products",
    });
    console.log("Chroma v2 connected, collection loaded");
  } catch (err) {
    console.warn("Chroma connection failed:", err.message);
    chromaClient = null;
    chromaCollection = null;
  }
}

// Gọi lần đầu khi import
initChroma();

// ========== EMBEDDING CACHE LAYER ==========
// In-memory cache: lưu embedding của user questions (tránh gọi API lặp lại)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000; // Giới hạn 1000 queries

async function getEmbeddingCached(text) {
  const cacheKey = text.toLowerCase().trim();

  // Step 1: Kiểm tra cache
  if (embeddingCache.has(cacheKey)) {
    console.log(`[CACHE HIT] "${text.substring(0, 40)}..."`);
    return embeddingCache.get(cacheKey);
  }

  // Step 2: Nếu không có → gọi Gemini API
  console.log(`[CACHE MISS] Embedding: "${text.substring(0, 40)}..."`);
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    // Step 3: Lưu vào cache
    embeddingCache.set(cacheKey, embedding);

    // Step 4: Cleanup nếu cache quá lớn
    if (embeddingCache.size > MAX_CACHE_SIZE) {
      const firstKey = embeddingCache.keys().next().value;
      embeddingCache.delete(firstKey);
      console.log(`[CACHE] Evicted oldest entry, size: ${embeddingCache.size}`);
    }

    console.log(
      `[CACHE] Saved, size: ${embeddingCache.size}/${MAX_CACHE_SIZE}`,
    );
    return embedding;
  } catch (err) {
    console.error("Embedding error:", err.message);
    return null;
  }
}

// Embedding function
async function getEmbedding(text) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("Embedding error:", err.message);
    return null;
  }
}

// Query Chroma để lấy context liên quan (Chroma v2)
async function queryRAGContext(userQuestion, topK = 10) {
  try {
    if (!chromaCollection) {
      console.log("Chroma not available, skipping RAG");
      return "";
    }

    const normalizedQuestion = normalizeText(userQuestion);
    console.log(`\n[RAG] Original query: "${userQuestion}"`);
    console.log(`[RAG] Normalized query: "${normalizedQuestion}"`);

    const embedding = await getEmbeddingCached(normalizedQuestion);
    if (!embedding) return "";

    console.log(`[RAG QUERY] Searching top ${topK} documents...\n`);

    const results = await chromaCollection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
    });

    if (!results || !results.documents || results.documents.length === 0) {
      console.log("[RAG] ⚠️ No documents found!");
      return "";
    }

    // Lấy top K documents từ kết quả với detailed logging
    const documents = results.documents[0] || [];
    const distances = results.distances[0] || [];
    const metadatas = results.metadatas[0] || [];

    console.log(`[RAG RESULTS] Retrieved ${documents.length} documents:`);
    console.log("─".repeat(80));

    // DEBUG: Log first 3 metadatas to see structure
    console.log("[DEBUG] Sample metadata from Chroma:");
    for (let i = 0; i < Math.min(3, metadatas.length); i++) {
      console.log(`  Metadata[${i}]:`, JSON.stringify(metadatas[i]));
    }
    console.log("─".repeat(80));

    documents.forEach((doc, idx) => {
      const distance = distances[idx] || 0;
      const similarity = 1 - distance; // Convert distance to similarity
      const metadata = metadatas[idx];
      const productName = metadata?.name || "Unknown";
      const category = metadata?.category || "N/A";

      const score = Math.round(similarity * 100);
      const scoreBar =
        "█".repeat(Math.floor(score / 5)) +
        "░".repeat(20 - Math.floor(score / 5));

      console.log(`[${idx + 1}] ${productName}`);
      console.log(`Category: ${category}`);
      console.log(`Similarity: ${scoreBar} ${score}%`);
      console.log(`Distance: ${distance.toFixed(6)}`);
    });
    console.log("─".repeat(80) + "\n");

    const context = documents
      .filter((doc) => doc && typeof doc === "string")
      .slice(0, topK)
      .join("\n\n---SEPARATOR---\n\n");

    console.log(`[RAG] Context prepared with ${documents.length} documents\n`);
    return context;
  } catch (err) {
    console.error("RAG query error:", err.message);
    return "";
  }
}

// ========== LOAD PRODUCTS FROM DB USING RAG RESULTS ==========
// Dùng Chroma để tìm sản phẩm liên quan, sau đó lấy GIÁ/TỒN KHO thực tế từ MySQL
async function getRAGProductsFromDB(userQuestion, topKProducts = 5) {
  try {
    if (!chromaCollection) {
      console.log("[RAG] Chroma not available, skip product DB lookup");
      return [];
    }

    const normalizedQuestion = normalizeText(userQuestion);
    const embedding = await getEmbeddingCached(normalizedQuestion);
    if (!embedding) return [];

    const results = await chromaCollection.query({
      queryEmbeddings: [embedding],
      nResults: topKProducts,
    });

    if (!results || !results.metadatas || !results.metadatas.length) {
      return [];
    }

    const metadatas = results.metadatas[0] || [];

    console.log(`[DEBUG] Total metadatas from Chroma: ${metadatas.length}`);
    console.log(`[DEBUG] First 3 metadatas:`);
    for (let i = 0; i < Math.min(3, metadatas.length); i++) {
      console.log(
        `  [${i}]: type=${metadatas[i]?.type}, id=${metadatas[i]?.id}, variant=${metadatas[i]?.variant_name}, price=${metadatas[i]?.price}`,
      );
    }

    // ===== IMPROVED: Get product VARIANTS (not deduplicate by id) =====
    // Filter only products (not blogs)
    const productMetas = metadatas.filter((m) => m && m.type === "product");
    console.log(`[DEBUG] Product metas (all variants): ${productMetas.length}`);

    // Take top K but keep EACH VARIANT separate
    const topProductMetas = productMetas.slice(0, topKProducts);

    // Extract variant details directly from metadata (no DB query needed!)
    const products = topProductMetas.map((m, idx) => ({
      id: m.id,
      name: m.name,
      variant_name: m.variant_name || "Mặc định",
      category: m.category,
      price: parseFloat(m.price) || 0,
      stock: parseInt(m.stock) || 0,
      unit: m.unit || "đơn vị",
    }));

    console.log(
      `[DEBUG] Extracted ${products.length} variants directly from Chroma metadata`,
    );

    return products;
  } catch (err) {
    console.error("[RAG PRODUCT ERROR]", err.message);
    return [];
  }
}

// ========== INTENT DETECTION ==========
// Detect: user hỏi về sản phẩm hay chỉ greeting/chat bình thường?
function detectProductQuery(userMessage) {
  const message = userMessage.toLowerCase().trim();

  // Keywords for product query
  const productKeywords = [
    "sản phẩm",
    "mua",
    "giá",
    "tồn kho",
    "stock",
    "danh sách",
    "có",
    "gì",
    "nào",
    "như thế nào",
    "loại nào",
    "cái nào",
    "từ vịt",
    "từ gà",
    "từ heo",
    "từ cá",
    "hải sản",
    "chả",
    "nem",
    "ruốc",
    "hạt",
    "bánh",
    "tìm",
    "kiếm",
    "gợi ý",
    "recommend",
    "đề xuất",
  ];

  // Greeting/small talk (NOT product query)
  const greetingKeywords = [
    "xin chào",
    "hello",
    "hi",
    "chào",
    "cảm ơn",
    "thank",
    "tạm biệt",
    "bye",
    "goodbye",
    "ơi",
    "được không",
    "được không",
    "sao",
  ];

  // If greeting → NOT a product query
  if (greetingKeywords.some((kw) => message.includes(kw))) {
    // Check if it's combined with product keyword
    const hasProduct = productKeywords.some((kw) => message.includes(kw));
    if (!hasProduct) return false; // Pure greeting
  }

  // If has product keyword → IS a product query
  return productKeywords.some((kw) => message.includes(kw));
}

// ========== IMPROVED STRUCTURED PROMPT ==========
// Prompt mới: liệt kê nhưng có tone nhân viên CSKH, không cứng nhắc
function buildPromptStructuredNatural(userQuestion, products) {
  const productList = products
    .map((p, idx) => {
      const variantInfo = p.variant_name ? ` (${p.variant_name})` : "";
      // ✅ Hiển thị rõ tình trạng tồn kho
      const stockStatus =
        p.stock > 0 ? `Còn hàng (${p.stock} ${p.unit})` : "Tạm hết hàng";
      return `${idx + 1}. ${p.name}${variantInfo} - Danh mục: ${p.category} - Giá: ${p.price.toLocaleString("vi-VN")} VNĐ - Tồn kho: ${stockStatus}`;
    })
    .join("\n");

  let prompt = `Bạn là nhân viên chăm sóc khách hàng (CSKH) thân thiện của cửa hàng. 

Câu hỏi của khách: ${userQuestion}

Sản phẩm có sẵn liên quan:
${productList}

HƯỚNG DẪN:
- Chỉ trả lời những gì được trả về từ danh sách sản phẩm ở trên
- KHÔNG được tạo ra, gợi ý hoặc đề cập đến bất kỳ sản phẩm nào không có trong danh sách
- Dù sản phẩm "Tạm hết hàng", vẫn phải thông báo GIÁ và cho khách biết có thể đặt trước hoặc liên hệ cửa hàng
- KHÔNG được nói "cửa hàng không có sản phẩm này" nếu sản phẩm có trong danh sách dù hết hàng
- Trả lời TỰ NHIÊN như nhân viên CSKH thực, không cứng nhắc
- Khi có nhiều biến thể cùng 1 sản phẩm, hãy liệt kê rõ tất cả loại với giá và tồn kho riêng
- Sẵn sàng giải đáp thêm thông tin về giá, tồn kho, hướng dẫn sử dụng
- Các câu hỏi không tìm được thông tin từ sản phẩm hay blog, hãy trả lời là liên hệ với cửa hàng qua số điện thoại, zalo hoặc trang liên hệ
- Nói ngắn gọn, đúng trọng tâm, rõ ràng`;

  return prompt;
}

// ========== REGULAR CHAT PROMPT ==========
// Dùng khi user không hỏi về sản phẩm (greeting, chit-chat, etc)
function buildPromptRegular(userQuestion) {
  return `Bạn là nhân viên chăm sóc khách hàng (CSKH) thân thiện. Trả lời tự nhiên, thân thiện, giống như nói chuyện với con người. Nếu khách hỏi về sản phẩm cửa hàng, bạn có thể giới thiệu, nhưng không ép buộc.

Câu hỏi của khách: ${userQuestion}

Trả lời một cách tự nhiên và thân thiện.`;
}

// ========== BUILD PROMPT STRUCTURED (mapping to Natural) ==========
// Wrapper: buildPromptStructured now uses Natural tone
function buildPromptStructured(userQuestion, products) {
  return buildPromptStructuredNatural(userQuestion, products);
}

// ----------------------------------
//         CALL GEMINI SDK WITH FORMATTED CONTENTS
// ----------------------------------
// Unified function để gọi Gemini API
async function callGeminiRest(
  recentMessages,
  finalPrompt,
  temperature = 0.5,
  max_tokens = 800,
  retryCount = 0,
) {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key missing");

  try {
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    // Convert conversation messages to Gemini format
    let contents = recentMessages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Replace last user message with finalPrompt (which includes RAG context + instructions)
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1] = {
        role: "user",
        parts: [{ text: finalPrompt }],
      };
    } else {
      // Fallback: if last message is not user, add finalPrompt as new user message
      contents.push({
        role: "user",
        parts: [{ text: finalPrompt }],
      });
    }

    const config = {
      generationConfig: {
        temperature,
        maxOutputTokens: max_tokens,
      },
      thinkingConfig: { thinkingBudget: -1 },
    };

    // Call Gemini model
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config,
      contents,
    });

    // Extract response text
    let reply = "";
    try {
      if (Array.isArray(response?.candidates) && response.candidates.length) {
        const c = response.candidates[0];

        // Case 1: c.content is object with parts directly
        if (Array.isArray(c.content?.parts)) {
          for (const p of c.content.parts) {
            if (typeof p?.text === "string") reply += p.text;
          }
        }
        // Case 2: c.content is array of blocks
        else if (Array.isArray(c.content)) {
          for (const block of c.content) {
            if (Array.isArray(block?.parts)) {
              for (const p of block.parts) {
                if (typeof p?.text === "string") reply += p.text;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log("ERROR: Failed to extract response text:", e.message);
    }

    return reply;
  } catch (err) {
    // Retry logic cho 503 error (model overloaded)
    if (err.status === 503 && retryCount < 2) {
      console.log(
        `WARN: API overloaded (503). Retrying... (attempt ${retryCount + 2}/3)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      return callGeminiRest(
        recentMessages,
        finalPrompt,
        temperature,
        max_tokens,
        retryCount + 1,
      );
    }

    throw err;
  }
}

// ----------------------------------
//           CHAT HANDLER WITH RAG
// ----------------------------------
async function chatHandler(req, res) {
  // ===== START TIMER (outside try block) =====
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });

  try {
    const { messages, prompt, max_tokens = 800 } = req.body || {};
    if (!messages && !prompt)
      return res
        .status(400)
        .json({ success: false, message: "messages or prompt required" });

    const chatMessages =
      Array.isArray(messages) && messages.length
        ? messages
        : [{ role: "user", content: String(prompt) }];

    // Lấy user message cuối cùng để query RAG
    const lastUserMessage =
      chatMessages.length > 0
        ? chatMessages[chatMessages.length - 1].content || ""
        : prompt || "";

    // Giới hạn 5 messages cuối để tiết kiệm token
    const recentMessages = chatMessages.slice(-5);
    console.log(`\n[${timestamp}] NEW CHAT REQUEST`);
    console.log(`User: "${lastUserMessage.substring(0, 50)}..."`);
    console.log(`Messages: ${recentMessages.length}`);

    // ===== STEP 0: Detect Intent =====
    const isProductQuery = detectProductQuery(lastUserMessage);
    console.log(`Product query: ${isProductQuery}`);

    let reply = "";
    let products = [];
    let finalPrompt = "";
    let ragMs = 0;
    let dbMs = 0;

    const intentTime = Date.now();
    const intentMs = intentTime - startTime;
    console.log(`Time (Intent): ${intentMs}ms`);

    if (isProductQuery) {
      // ===== PRODUCT QUERY PATH =====
      console.log(`Mode: PRODUCT (RAG + structured prompt)`);
      const ragStartTime = Date.now();

      // Step 1: Query RAG context - lấy 10 documents để có nhiều lựa chọn
      const ragContext = await queryRAGContext(lastUserMessage, 10);
      const ragEndTime = Date.now();
      ragMs = ragEndTime - ragStartTime;
      console.log(
        `Time (RAG): ${ragMs}ms, Context length: ${ragContext.length} chars`,
      );

      // Step 2: Lấy danh sách sản phẩm từ DB dựa trên kết quả RAG
      const dbStartTime = Date.now();
      products = await getRAGProductsFromDB(lastUserMessage, 5);
      const dbEndTime = Date.now();
      dbMs = dbEndTime - dbStartTime;
      console.log(`Time (DB): ${dbMs}ms, Products: ${products.length}`);

      // Step 3: Build structured prompt (with natural tone for CSKH)
      finalPrompt = buildPromptStructured(lastUserMessage, products);
    } else {
      // ===== REGULAR CHAT PATH (greeting, chit-chat) =====
      console.log(`Mode: CHAT (no RAG)`);
      finalPrompt = buildPromptRegular(lastUserMessage);
    }

    const preGeminiMs = Date.now() - startTime;
    console.log(`Time (Pre-Gemini): ${preGeminiMs}ms`);

    // ===== STEP 4: Call Gemini API =====
    const geminiStartTime = Date.now();
    const temperature = isProductQuery ? 0.5 : 0.6;
    console.log(
      `Calling Gemini (temperature: ${temperature}, messages: ${recentMessages.length})`,
    );

    reply = await callGeminiRest(
      recentMessages,
      finalPrompt,
      temperature,
      max_tokens,
    );

    const geminiEndTime = Date.now();
    const geminiMs = geminiEndTime - geminiStartTime;
    console.log(
      `Time (Gemini API): ${geminiMs}ms, Reply length: ${reply.length} chars`,
    );

    if (!reply) {
      console.error("ERROR: Empty reply from Gemini");
      return res.status(500).json({
        success: false,
        message: "Empty response from Gemini",
      });
    }

    // ===== TOTAL TIME =====
    const totalTime = Date.now() - startTime;
    console.log(`\nSUCCESS - Total time: ${totalTime}ms`);
    console.log(
      `Breakdown: Intent=${intentMs}ms, RAG=${ragMs}ms, DB=${dbMs}ms, Gemini=${geminiMs}ms`,
    );
    console.log(`Cache size: ${embeddingCache.size}/1000`);
    console.log(`---`);

    res.json({
      success: true,
      data: {
        assistant: { role: "assistant", content: reply },
        raw: null,
        products: products.slice(0, 10),
        metrics: {
          totalTime,
          intentTime: intentMs,
          geminiTime: geminiMs,
          cacheHit: embeddingCache.size,
        },
      },
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`\nERROR - Time: ${totalTime}ms`);
    console.error(`Error: ${err.message}`);
    if (err.status) console.error(`Status: ${err.status}`);
    console.log(`---`);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

module.exports = { chatHandler, chatRateLimiter };

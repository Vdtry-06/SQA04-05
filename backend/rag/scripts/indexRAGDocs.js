const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// load dataz
const docsPath = path.join(__dirname, "..", "data", "rag_docs.json");
const docs = JSON.parse(fs.readFileSync(docsPath, "utf8"));

// init Chroma v2
const client = new ChromaClient({
  host: "localhost",
  port: 8000,
});
let collection;

async function embedText(text) {
  const res = await model.embedContent(text);
  return res.embedding.values;
}

async function checkEmbeddingDimensions() {
  try {
    console.log("\nChecking embedding dimensions...");
    const testEmbedding = await embedText("test");
    const dimensions = testEmbedding.length;
    console.log(
      `✓ gemini-embedding-001 produces vectors with ${dimensions} dimensions\n`,
    );
    return dimensions;
  } catch (err) {
    console.error("Error checking dimensions:", err.message);
    return null;
  }
}

function sanitizeMetadata(metadata) {
  if (!metadata) return {};
  const result = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      result[key] = "";
    } else if (Array.isArray(value) || typeof value === "object") {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function run() {
  console.log("Creating collection rag_products...");
  await checkEmbeddingDimensions();

  // Xóa collection cũ
  try {
    await client.deleteCollection({ name: "rag_products" });
    console.log("Deleted old collection");
  } catch (e) {}

  collection = await client.getOrCreateCollection({ name: "rag_products" });

  let count = 0;
  for (const doc of docs) {
    count++;
    if (count % 50 === 0) console.log(`  Processed ${count}/${docs.length}...`);

    await collection.add({
      ids: [doc.id],
      embeddings: [await embedText(doc.text)],
      metadatas: [sanitizeMetadata(doc.metadata)], // ✅ thêm vào đây
      documents: [doc.text],
    });
  }

  console.log("Indexing completed! Total:", docs.length);
}

run().catch((err) => console.error("Error:", err));

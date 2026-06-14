const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { pool } = require("../../config/mysql");
const { buildCleanProductText, normalizeText } = require("./textNormalization");

const CHUNK_SIZE = parseInt(process.env.RAG_CHUNK_SIZE || "900", 10);
const CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP || "150", 10);

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text) return [];
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = start + size;
    if (end >= text.length) {
      parts.push(text.slice(start).trim());
      break;
    }
    // try to break on sentence boundary (period, newline) backward
    let slice = text.slice(start, end);
    const lastPeriod = slice.lastIndexOf(". ");
    const lastNL = slice.lastIndexOf("\n");
    const bp = Math.max(lastPeriod, lastNL);
    if (bp > Math.floor(size * 0.5)) {
      end = start + bp + 1;
    }
    parts.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return parts.filter(Boolean);
}

async function fetchProductsWithVariants() {
  const [products] = await pool.query(`
    SELECT p.id, p.name, p.description, p.avatar, p.origin, p.expiry_date, p.status,
           c.name AS category, s.name AS supplier
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1
  `);
  const ids = products.map((p) => p.id);
  let variants = [];
  if (ids.length) {
    const [vrows] = await pool.query(
      "SELECT * FROM product_variants WHERE product_id IN (?)",
      [ids],
    );
    variants = vrows;
  }
  const byProduct = {};
  products.forEach((p) => (byProduct[p.id] = { ...p, variants: [] }));
  variants.forEach((v) => {
    if (byProduct[v.product_id]) byProduct[v.product_id].variants.push(v);
  });
  return Object.values(byProduct);
}

async function fetchBlogs() {
  const [rows] = await pool.query(
    "SELECT id, title, content, created_at FROM blogs",
  );
  return rows;
}

// NEW: Tạo text cho sản phẩm với 1 variant cụ thể
function buildProductText(product, variant, variantIndex) {
  return buildCleanProductText(product, variant);
}

async function run() {
  const docs = [];

  // ========== PRODUCTS: Mỗi variant = 1 document ==========
  console.log("Processing products...");
  const products = await fetchProductsWithVariants();

  let totalProductDocs = 0;
  for (const p of products) {
    const variants = p.variants || [];

    if (variants.length === 0) {
      console.log(`Warning: Product "${p.name}" has no variants, skipping...`);
      continue;
    }

    // Tạo 1 document cho mỗi variant
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const text = buildProductText(p, v, i);

      docs.push({
        id: `product:${p.id}:variant:${i}`,
        text: text,
        metadata: {
          type: "product",
          source: "products",
          id: p.id,
          name: p.name,
          category: p.category || "N/A",
          variant_name: v.name,
          variant_index: i,
          price: v.price_sale,
          stock: v.stock,
          unit: v.unit,
          origin: p.origin || "N/A",
          created_at: new Date().toISOString(),
          language: "vi",
        },
      });
      totalProductDocs++;
    }
  }
  console.log(
    `Created ${totalProductDocs} product documents (from ${products.length} products with variants)`,
  );

  // ========== BLOGS: Still chunking (vì text dài) ==========
  console.log("Processing blogs...");
  const blogs = await fetchBlogs();
  let blogDocsCount = 0;

  for (const b of blogs) {
    const normalizedTitle = normalizeText(b.title);
    const normalizedContent = normalizeText(b.content);
    const text = `${normalizedTitle}\n\n${normalizedContent}`;
    const chunks = chunkText(text);
    for (let i = 0; i < chunks.length; i++) {
      docs.push({
        id: `blog:${b.id}::${i}`,
        text: chunks[i],
        metadata: {
          type: "blog_chunk",
          source: "blogs",
          id: b.id,
          title: normalizedTitle,
          chunk_index: i,
          created_at: b.created_at,
          language: "vi",
        },
      });
      blogDocsCount++;
    }
  }
  console.log(
    `Created ${blogDocsCount} blog documents (from ${blogs.length} blogs)`,
  );

  // ========== SAVE ==========
  const outPath = path.join(__dirname, "..", "data", "rag_docs.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), "utf8");

  console.log(`\nSUCCESS!`);
  console.log(`Total documents: ${docs.length}`);
  console.log(`   - Product variants: ${totalProductDocs}`);
  console.log(`   - Blog chunks: ${blogDocsCount}`);
  console.log(`Saved to: ${outPath}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

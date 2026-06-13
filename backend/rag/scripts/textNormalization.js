const fs = require('fs');
const path = require('path');

function normalizeText(text) {
  if (!text) return '';

  // Step 1: Normalize Unicode (NFC)
  text = text.normalize('NFC');

  // Step 2: Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Step 3: IMPROVED - Keep Vietnamese characters and diacritics
  // Instead of removing all special characters, only remove truly unwanted ones
  // Keep: letters (with accents), numbers, spaces, hyphens, periods, commas
  text = text.replace(/[^\p{L}\p{N}\s\-\.,;:'"]/gu, ' ');
  
  // Step 4: Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Step 5: Convert to lowercase
  text = text.toLowerCase();

  // Step 6: Remove common Vietnamese stop words
  const stopWords = [
    'của', 'và', 'là', 'được', 'có', 'cái', 'chiếc', 'những', 'cùng', 'với',
    'từ', 'để', 'trong', 'ngoài', 'sau', 'trước', 'giữa', 'dưới', 'trên',
    'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'
  ];
  
  // Remove stop words but keep them if they're product descriptors
  const productDescriptors = ['từ vịt', 'từ gà', 'từ heo', 'từ cá', 'từ tôm'];
  const isProductDescriptor = productDescriptors.some(desc => text.includes(desc));
  
  if (!isProductDescriptor) {
    const words = text.split(' ');
    text = words.filter(w => !stopWords.includes(w) || w.length > 1).join(' ');
  }

  // DEBUG: Log normalized text
  console.log(`[NORMALIZE] Original: "${arguments[0].substring(0, 60)}..."`);
  console.log(`[NORMALIZE] After: "${text.substring(0, 60)}..."`);

  return text;
}

function normalizePrice(priceStr) {
  if (!priceStr && priceStr !== 0) return '';

  let str = String(priceStr);

  // Remove currency symbols and whitespace, keep numbers
  str = str
    .replace(/[đDVNDvnd]/g, '')  // Remove currency
    .replace(/\s/g, '')           // Remove whitespace
    .trim();

  // Keep dots/commas if they're decimal separators
  // Convert comma (European) to dot (English standard)
  str = str.replace(/,/g, '.');

  return str;
}

function normalizeUnit(unit) {
  if (!unit) return 'unit';

  const normalized = normalizeText(unit);

  const unitMap = {
    'chiec': 'chiec',
    'cai': 'cai',
    'hop': 'hop',
    'goi': 'goi',
    'chai': 'chai',
    'thung': 'thung',
    'kg': 'kg',
    'gram': 'gram',
    'ly': 'ly',
    'lit': 'lit',
  };

  return unitMap[normalized] || normalized;
}

function buildCleanProductText(product, variant) {
  if (!product) return '';

  // Nếu không có variant thì skip
  if (!variant) return '';

  const name = normalizeText(product.name);
  const category = normalizeText(product.category || '');
  const supplier = normalizeText(product.supplier || '');
  const origin = normalizeText(product.origin || '');

  let description = '';
  if (product.description) {
    description = normalizeText(product.description)
      .substring(0, 300)
      .trim();
  }

  // Build text for this specific variant
  const price = normalizePrice(variant.price_sale);
  const stock = variant.stock || '0';
  const unit = normalizeUnit(variant.unit);

  const parts = [
    name,
    category && `danh muc ${category}`,
    supplier && `nha cung cap ${supplier}`,
    origin && `xuat xu ${origin}`,
    `gia ${price}`,
    `ton kho ${stock}`,
    `don vi ${unit}`,
    description && `mo ta ${description}`
  ].filter(Boolean);

  return parts.join(' ');
}

module.exports = {
  normalizeText,
  normalizePrice,
  normalizeUnit,
  buildCleanProductText
};

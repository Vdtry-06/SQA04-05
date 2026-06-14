import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar';

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFromUrl = searchParams.get('category_id') || searchParams.get('category');
  const searchFromUrl = searchParams.get('search');

  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl ? parseInt(categoryFromUrl) : null);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl || '');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data ? categoriesData.data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products based on selected category or search query
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url;

        if (searchQuery) {
          // Fetch products by search query
          url = 'http://localhost:5000/api/products/productByName';
          const productsResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: searchQuery })
          });
          if (!productsResponse.ok) {
            throw new Error('Failed to fetch products');
          }
          const productsData = await productsResponse.json();
          setAllProducts(productsData.data ? productsData.data : []);
        } else if (selectedCategory) {
          // Fetch products by category
          url = `http://localhost:5000/api/products/productByType/${selectedCategory}`;
          const productsResponse = await fetch(url);
          if (!productsResponse.ok) {
            throw new Error('Failed to fetch products');
          }
          const productsData = await productsResponse.json();
          setAllProducts(productsData.data ? productsData.data : []);
        } else {
          // Fetch all products
          url = 'http://localhost:5000/api/products/allProducts';
          const productsResponse = await fetch(url);
          if (!productsResponse.ok) {
            throw new Error('Failed to fetch products');
          }
          const productsData = await productsResponse.json();
          setAllProducts(productsData.data ? productsData.data : []);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Update selected category or search query when URL changes
  useEffect(() => {
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      setSelectedCategory(null);
      setCurrentPage(1);
    } else if (categoryFromUrl) {
      setSelectedCategory(parseInt(categoryFromUrl));
      setSearchQuery('');
      setCurrentPage(1);
    } else {
      // Reset all filters when no category or search in URL
      setSelectedCategory(null);
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [categoryFromUrl, searchFromUrl]);

  // Filter and sort products
  const filteredProducts = allProducts
    .filter(product => {
      // Lấy giá từ variant đầu tiên
      const price = product.variants && product.variants.length > 0
        ? product.variants[0].price_sale
        : 0;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];

      // Lọc theo category (nếu có) - sử dụng category_id từ backend
      const categoryMatch = !selectedCategory || product.category_id === selectedCategory;

      return priceMatch && categoryMatch;
    })
    .sort((a, b) => {
      const priceA = a.variants && a.variants.length > 0 ? a.variants[0].price_sale : 0;
      const priceB = b.variants && b.variants.length > 0 ? b.variants[0].price_sale : 0;

      switch (sortBy) {
        case 'price_low_to_high':
          return priceA - priceB;
        case 'price_high_to_low':
          return priceB - priceA;
        case 'rating': {
          const ra = Number(a.avg_rating || 0);
          const rb = Number(b.avg_rating || 0);
          return rb - ra;
        }
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  // Lấy tên danh mục được chọn
  const selectedCategoryName = selectedCategory
    ? categories.find(cat => cat.id === selectedCategory)?.name
    : null;

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handlePriceChange = (e, index) => {
    const newRange = [...priceRange];
    newRange[index] = parseInt(e.target.value);
    if (newRange[0] <= newRange[1]) {
      setPriceRange(newRange);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600">
        <button
          onClick={() => navigate('/')}
          className="text-green-700 font-semibold hover:underline cursor-pointer"
        >
          TRANG CHỦ
        </button>
        <span className="mx-2">/</span>
        {selectedCategoryName || searchQuery ? (
          <>
            <button
              onClick={() => navigate('/product', { replace: true })}
              className="text-green-700 font-semibold hover:underline cursor-pointer"
            >
              SẢN PHẨM
            </button>
            <span className="mx-2">/</span>
            <span className="text-green-700 font-bold">
              {selectedCategoryName ? selectedCategoryName.toUpperCase() : `Kết quả tìm kiếm: "${searchQuery}"`}
            </span>
          </>
        ) : (
          <span className="text-green-700 font-bold">SẢN PHẨM</span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            {/* Category Sidebar */}
            <CategorySidebar
              categories={categories}
              loading={loading}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />

            {/* Price Filter - Only show when not searching or filtering by category */}
            {!searchQuery && !selectedCategory && (
              <div className="mb-6">
                <h3 className="bg-green-600 text-white px-4 py-3 rounded-full font-bold mb-4">
                  LỌC SẢN PHẨM
                </h3>
                <div className="px-4">
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700">Giá:</label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="10000"
                        value={priceRange[0]}
                        onChange={(e) => handlePriceChange(e, 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="10000"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(e, 1)}
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Giá: {priceRange[0].toLocaleString('vi-VN')} - {priceRange[1].toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {searchQuery || selectedCategory
                  ? `Hiển thị tất cả ${filteredProducts.length} kết quả`
                  : `Hiển thị 1-${Math.min(itemsPerPage, filteredProducts.length)} trong ${filteredProducts.length} kết quả`
                }
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer hover:border-gray-400"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_low_to_high">Giá: Thấp đến Cao</option>
                <option value="price_high_to_low">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Lỗi: {error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6 mb-8">
                {displayedProducts.map(product => {
                  const price = product.variants && product.variants.length > 0
                    ? product.variants[0].price_sale
                    : 0;
                  return (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                      {/* Product Image */}
                      <div className="bg-gray-100 h-48 flex items-center justify-center relative overflow-hidden">
                        {product.avatar ? (
                          <img
                            src={product.avatar}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-6xl">📦</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 truncate">{product.name}</h4>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2">
                          {(() => {
                            const count = Number(product.review_count || 0);
                            const rating = Number(product.avg_rating || 0);
                            const stars = count > 0 ? Math.max(1, Math.round(rating)) : 4;
                            return (
                              <>
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                ))}
                              </>
                            );
                          })()}
                        </div>

                        {/* Seller */}
                        {/* <p className="text-xs text-gray-600 mb-3">• GIÁ BẢN: LIÊN HỆ</p> */}

                        {/* Price */}
                        <div className="text-lg font-bold text-green-600 mb-3">
                          {price.toLocaleString('vi-VN')} ₫
                        </div>

                        {/* Add to Cart Button */}
                        <button className="w-full bg-orange-500 text-white py-2 rounded font-semibold hover:bg-orange-600 transition">
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-full font-semibold transition ${
                    currentPage === i + 1
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

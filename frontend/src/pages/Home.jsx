import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySidebar from '../components/CategorySidebar';

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsResponse = await fetch('http://localhost:5000/api/products/allProducts');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setProducts(productsData.data ? productsData.data : []);

        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data ? categoriesData.data : []);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* TOP: Category (left) + Large Banner (right) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <CategorySidebar
              categories={categories}
              loading={loading}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          <div className="md:col-span-3">
            <div className="w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src="/Banner-combo-vit-1400x526.jpg"
                className="w-full h-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        {/* INTRODUCTION SECTION (full width under the banner & category) */}
        <div className="prose max-w-none mb-6 text-gray-600">
          <h3 className="text-lg font-bold text-gray-800">SỨ MỆNH :</h3>
          <p className="mb-4">
            • Sứ mệnh của BẾP SẠCH VIỆT là trở thành nhịp cầu kết nối văn hóa ẩm thực giữa các vùng miền và người tiêu dùng.
            Thương hiệu không chỉ muốn mang đến những món ăn ngon mà còn lan tỏa những giá trị tinh túy của ẩm thực Việt Nam,
            giúp mỗi người tiêu dùng, dù ở bất cứ đâu, đều có thể trải nghiệm trọn vẹn hương vị quê hương.
          </p>
          <p className="mb-4">
            • Với BẾP SẠCH VIỆT, mỗi bữa ăn không chỉ là thời gian thưởng thức món ngon mà còn là cơ hội để gắn kết gia đình,
            chia sẻ yêu thương và trân trọng những giá trị truyền thống. Trong tương lai, BẾP SẠCH VIỆT sẽ không ngừng nỗ lực
            để tiếp tục sứ mệnh này, mở rộng thêm các dòng sản phẩm đặc sản vùng miền, mang đến sự lựa chọn phong phú và tiện lợi cho người tiêu dùng.
          </p>
          <h3 className="text-lg font-bold text-gray-800 mt-6">GIÁ TRỊ CỐT LÕI:</h3>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Chất lượng và an toàn thực phẩm</li>
            <li>Tôn vinh giá trị truyền thống</li>
            <li>Tiện lợi và thân thiện với người tiêu dùng</li>
            <li>Bền vững và có trách nhiệm</li>
          </ol>
        </div>

        {/* THREE SMALL BANNERS (full width) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="h-45 bg-gray-100 rounded flex items-center justify-center p-2">
            <img src="/banner1.png" alt="banner1" className="max-h-full max-w-full object-contain" onError={(e)=>e.currentTarget.style.display='none'} />
          </div>
          <div className="h-45 bg-gray-100 rounded flex items-center justify-center p-2">
            <img src="/banner2.png" alt="banner2" className="max-h-full max-w-full object-contain" onError={(e)=>e.currentTarget.style.display='none'} />
          </div>
          <div className="h-45 bg-gray-100 rounded flex items-center justify-center p-2">
            <img src="/banner3.png" alt="banner3" className="max-h-full max-w-full object-contain" onError={(e)=>e.currentTarget.style.display='none'} />
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            {selectedCategory
              ? `Sản Phẩm - ${categories.find(c => c.id === selectedCategory)?.name || 'Danh mục'}`
              : 'Sản Phẩm'}
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Lỗi: {error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => {
                const price = product.variants && product.variants.length > 0
                  ? product.variants[0].price_sale
                  : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
                  >
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
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
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 truncate">{product.name}</h4>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-green-600">
                          {price.toLocaleString('vi-VN')}đ
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                          {(() => {
                            const count = Number(product.review_count || 0);
                            const rating = Number(product.avg_rating || 0);
                            const starsCalc = count > 0 ? Math.max(1, Math.round(rating)) : 4;
                            return [...Array(5)].map((_, i) => (
                              <span key={i} className={i < starsCalc ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                            ));
                          })()}
                        </div>
                      </div>
                      <button className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

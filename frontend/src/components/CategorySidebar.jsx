import { useNavigate } from 'react-router-dom';

export default function CategorySidebar({ categories, loading, selectedCategory, onCategorySelect }) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId, categoryName) => {
    // Chuyển sang trang Product với danh mục được chọn
    navigate(`/product?category=${categoryId}`);

    // Gọi callback nếu có
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  return (
    <div className="col-span-1">
      <div className="bg-green-600 text-white rounded-lg overflow-hidden mb-6">
        <div className="bg-green-700 px-4 py-3 border-b-4 border-orange-500">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>🏷️</span> DANH MỤC SẢN PHẨM
          </h3>
        </div>
        {loading ? (
          <div className="px-4 py-3 text-sm">Đang tải...</div>
        ) : (
          <ul className="space-y-0">
            {categories.map(cat => (
              <li
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id, cat.name)}
                className={`px-4 py-3 cursor-pointer transition border-b border-green-500 last:border-b-0 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 font-bold'
                    : 'hover:bg-green-700'
                }`}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <>
      {/* Footer */}
      <footer className="bg-green-700 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-4 gap-8 mb-8">
            {/* Column 1 - LIÊN HỆ */}
            <div>
              <h4 className="font-bold text-lg mb-4">LIÊN HỆ</h4>
              <p className="text-sm mb-4">Chúng tôi chuyên cung cấp các đặc sản vùng miền</p>
              <p className="text-sm mb-2">📍 91 Tam Khương, nhà số 2, P. Khương thương, Q. Đống đa, HN.</p>
              <p className="text-sm mb-2">📞 Hotline: 0868839655 | 0963538357</p>
              <p className="text-sm mb-2">📧 Email: bepsachviet@gmail.com</p>
              <p className="text-sm">👍 Facebook: fb.com/bepsachvietOfficial</p>
            </div>

            {/* Column 2 - DANH MỤC */}
            <div>
              <h4 className="font-bold text-lg mb-4">DANH MỤC</h4>
              <ul className="space-y-2 text-sm">
                <li
                  onClick={() => handleNavigate('/home')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TRANG CHỦ
                </li>
                <li className="cursor-pointer transition">
                  <div className="flex items-center gap-2 hover:text-gray-200">
                    <span
                      onClick={() => handleNavigate('/product')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <span className="text-green-300">●</span> SẢN PHẨM
                    </span>
                    <ChevronDown
                      onClick={() => toggleCategory('danh-muc-san-pham')}
                      className={`w-4 h-4 transition-transform cursor-pointer ${expandedCategories['danh-muc-san-pham'] ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {expandedCategories['danh-muc-san-pham'] && (
                    <ul className="ml-4 mt-2 space-y-1 text-xs">
                      {categories.map(cat => (
                        <li 
                          key={cat.id}
                          onClick={() => handleNavigate(`/product?category_id=${cat.id}`)} 
                          className="hover:text-gray-200 cursor-pointer"
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                <li
                  onClick={() => handleNavigate('/news')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TIN TỨC
                </li>
                <li
                  onClick={() => handleNavigate('/about')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> GIỚI THIỆU
                </li>
                <li
                  onClick={() => handleNavigate('/distributor')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TUYÊN ĐẠI LÝ
                </li>
                <li
                  onClick={() => handleNavigate('/contact')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> LIÊN HỆ
                </li>
              </ul>
            </div>

            {/* Column 3 - HỖ TRỢ KHÁCH HÀNG */}
            <div>
              <h4 className="font-bold text-lg mb-4">HỖ TRỢ KHÁCH HÀNG</h4>
              <ul className="space-y-2 text-sm">
                <li
                  onClick={() => handleNavigate('/home')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TRANG CHỦ
                </li>
                <li className="cursor-pointer transition">
                  <div className="flex items-center gap-2 hover:text-gray-200">
                    <span
                      onClick={() => handleNavigate('/product')}
                      className="flex items-center gap-2 flex-1"
                    >
                      <span className="text-green-300">●</span> SẢN PHẨM
                    </span>
                    <ChevronDown
                      onClick={() => toggleCategory('ho-tro-san-pham')}
                      className={`w-4 h-4 transition-transform cursor-pointer ${expandedCategories['ho-tro-san-pham'] ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {expandedCategories['ho-tro-san-pham'] && (
                    <ul className="ml-4 mt-2 space-y-1 text-xs">
                      {categories.map(cat => (
                        <li 
                          key={cat.id}
                          onClick={() => handleNavigate(`/product?category_id=${cat.id}`)} 
                          className="hover:text-gray-200 cursor-pointer"
                        >
                          {cat.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                <li
                  onClick={() => handleNavigate('/news')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TIN TỨC
                </li>
                <li
                  onClick={() => handleNavigate('/about')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> GIỚI THIỆU
                </li>
                <li
                  onClick={() => handleNavigate('/distributor')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> TUYỂN ĐẠI LÝ
                </li>
                <li
                  onClick={() => handleNavigate('/contact')}
                  className="hover:text-gray-200 cursor-pointer transition flex items-center gap-2"
                >
                  <span className="text-green-300">●</span> LIÊN HỆ
                </li>
              </ul>
            </div>

            {/* Column 4 - KẾT NỐI */}
            <div>
              <h4 className="font-bold text-lg mb-4">KẾT NỐI VỚI BẾP SẠCH VIỆT</h4>
              <div className="space-y-3">
                <div className="bg-white text-green-700 p-3 rounded text-sm font-semibold">
                  📱 Bếp sạch.Việt
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">
                    f
                  </button>
                  <button className="flex-1 bg-blue-400 text-white py-2 rounded text-sm font-semibold hover:bg-blue-500 transition">
                    Zalo
                  </button>
                  <button className="flex-1 bg-green-500 text-white py-2 rounded text-sm font-semibold hover:bg-green-600 transition">
                    ☎️
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-green-600 pt-6 flex items-center justify-between text-sm">
            <p>Copyright 2025 © Giao diện Bếp sạch Việt</p>
            <div className="flex gap-6">
              <button onClick={() => handleNavigate('/home')} className="hover:text-gray-200 transition cursor-pointer">TRANG CHỦ</button>
              <button onClick={() => handleNavigate('/product')} className="hover:text-gray-200 transition cursor-pointer">SẢN PHẨM</button>
              <button onClick={() => handleNavigate('/news')} className="hover:text-gray-200 transition cursor-pointer">TIN TỨC</button>
              <button onClick={() => handleNavigate('/about')} className="hover:text-gray-200 transition cursor-pointer">GIỚI THIỆU</button>
              <button onClick={() => handleNavigate('/distributor')} className="hover:text-gray-200 transition cursor-pointer">TUYỂN ĐẠI LÝ</button>
              <button onClick={() => handleNavigate('/contact')} className="hover:text-gray-200 transition cursor-pointer">LIÊN HỆ</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Contact Buttons */}
      <div className="fixed right-4 bottom-4 flex flex-col gap-3">
        <button className="w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition text-xl">
          Zalo
        </button>
        <button className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition text-xl">
          ☎️
        </button>
      </div>
    </>
  );
}

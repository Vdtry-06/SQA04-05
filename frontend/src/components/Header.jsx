import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Phone, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

/**
 * Header component
 * - Hiển thị top info bar (hotline, address)
 * - Hiển thị logo + info cards + cart button
 * - Navigation bar với dropdown category
 * - Nếu chưa đăng nhập: hiện Đăng nhập / Đăng ký
 * - Nếu đã đăng nhập: hiện avatar + tên và popup menu (Account, Orders, Logout, ...)
 */

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();

  // UI state
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Categories: fetch from API so we have IDs for filtering
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Helper xác định menu active theo path
  const getActiveMenuFromPath = () => {
    if (location.pathname === '/home' || location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/product')) return 'product';
    if (location.pathname.startsWith('/blog')) return 'news';
    if (location.pathname.startsWith('/news')) return 'news';
    if (location.pathname.startsWith('/about')) return 'about';
    if (location.pathname.startsWith('/distributor')) return 'distributor';
    if (location.pathname.startsWith('/dealer')) return 'dealer';
    if (location.pathname.startsWith('/contact')) return 'contact';
    return 'home';
  };

  // Cập nhật active menu khi route thay đổi
  useEffect(() => {
    setActiveMenu(getActiveMenuFromPath());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Đóng popup khi route đổi
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);

  // Đóng popup khi click ngoài
  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Tìm kiếm
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/product?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Logout: xóa token/user và về home
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/auth/login');
  };

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-green-700 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Hotline: 0868839655 | 0963538357</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>91 Tam Khương, nhà số 2, P. Khương thương, Q. Đống đa, HN.</span>
            </div>
          </div>

          {/* Right side: nếu chưa login show Login/Register, nếu đã login show tên/avatar */}
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <button onClick={() => navigate('/auth/login')} className="hover:text-gray-200 transition">Đăng nhập</button>
                <span>/</span>
                <button onClick={() => navigate('/auth/register')} className="hover:text-gray-200 transition">Đăng ký</button>
              </>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1 rounded hover:bg-green-600/80 transition"
                >
                  {/* Avatar hoặc chữ cái đầu */}
                  <div className="h-7 w-7 rounded-full bg-white text-green-700 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-semibold">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm hidden sm:inline">{user.name || 'Tài khoản'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Popup menu khi đã đăng nhập */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50">
                    <ul className="py-1 text-sm">
                      <li>
                        <button
                          onClick={() => { navigate('/account'); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >Thông tin cá nhân</button>
                      </li>
                      <li>
                        <button
                          onClick={() => { navigate('/account/orders'); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >Đơn hàng</button>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >Thoát</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header main (logo + info cards + cart) */}
      <header className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-700">Bepsachviet.com</h1>
              <p className="text-xs text-gray-600">Thực phẩm sạch - An toàn cho gia đình</p>
            </div>
          </div>

          {/* Info cards and cart button */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🚚</span>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">Miễn phí vận chuyển</p>
                <p className="text-gray-600">Bán kính 5 km trở lên</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎧</span>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-800">Hỗ trợ 24/7</p>
                <p className="text-gray-600">Hotline: 0868839655</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/cart')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition relative"
            >
              Giỏ hàng
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-green-600 text-white py-3 px-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => { navigate('/home'); setActiveMenu('home'); }}
              onMouseEnter={() => setActiveMenu('home')}
              onMouseLeave={() => {
                if (location.pathname !== '/home' && location.pathname !== '/') setActiveMenu(getActiveMenuFromPath());
              }}
              className={`px-6 py-2 rounded font-semibold transition ${activeMenu === 'home' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:text-gray-200'}`}
            >
              TRANG CHỦ
            </button>

            {/* Product Dropdown */}
            <div className="relative group">
              <button
                onClick={() => { navigate('/product', { replace: true }); setActiveMenu('product'); }}
                onMouseEnter={() => { setShowProductMenu(true); setActiveMenu('product'); }}
                onMouseLeave={() => { setShowProductMenu(false); if (location.pathname !== '/product') setActiveMenu(getActiveMenuFromPath()); }}
                className={`flex items-center gap-1 px-3 py-2 rounded transition ${activeMenu === 'product' ? 'bg-orange-500 font-semibold' : 'hover:text-gray-200'}`}
              >
                SẢN PHẨM
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showProductMenu && (
                <div
                  onMouseEnter={() => setShowProductMenu(true)}
                  onMouseLeave={() => { setShowProductMenu(false); setActiveMenu('home'); }}
                  className="absolute left-0 mt-0 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-50"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        navigate(`/product?category=${cat.id}`);
                        setShowProductMenu(false);
                        setActiveMenu('product');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-green-100 transition text-sm"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { navigate('/blog'); setActiveMenu('news'); }}
              onMouseEnter={() => setActiveMenu('news')}
              onMouseLeave={() => { if (location.pathname !== '/blog') setActiveMenu(getActiveMenuFromPath()); }}
              className={`px-3 py-2 rounded transition ${activeMenu === 'news' ? 'bg-orange-500 font-semibold' : 'hover:text-gray-200'}`}
            >
              TIN TỨC
            </button>
            <button
              onClick={() => { navigate('/about'); setActiveMenu('about'); }}
              onMouseEnter={() => setActiveMenu('about')}
              onMouseLeave={() => { if (location.pathname !== '/about') setActiveMenu(getActiveMenuFromPath()); }}
              className={`px-3 py-2 rounded transition ${activeMenu === 'about' ? 'bg-orange-500 font-semibold' : 'hover:text-gray-200'}`}
            >
              GIỚI THIỆU
            </button>
            <button
              onClick={() => { navigate('/distributor'); setActiveMenu('distributor'); }}
              onMouseEnter={() => setActiveMenu('distributor')}
              onMouseLeave={() => { if (location.pathname !== '/distributor') setActiveMenu(getActiveMenuFromPath()); }}
              className={`px-3 py-2 rounded transition ${activeMenu === 'distributor' ? 'bg-orange-500 font-semibold' : 'hover:text-gray-200'}`}
            >
              TUYỂN ĐẠI LÝ
            </button>
            <button
              onClick={() => { navigate('/contact'); setActiveMenu('contact'); }}
              onMouseEnter={() => setActiveMenu('contact')}
              onMouseLeave={() => { if (location.pathname !== '/contact') setActiveMenu(getActiveMenuFromPath()); }}
              className={`px-3 py-2 rounded transition ${activeMenu === 'contact' ? 'bg-orange-500 font-semibold' : 'hover:text-gray-200'}`}
            >
              LIÊN HỆ
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-white rounded-full px-4 py-2 w-64">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 outline-none text-gray-800 text-sm"
            />
            <button onClick={handleSearch} className="cursor-pointer hover:opacity-70 transition">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
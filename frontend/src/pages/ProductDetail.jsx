import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import AddToCartModal from "../components/AddToCartModal";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, getUserId } = useAuth();
  const [searchParams] = useSearchParams();

  const { refreshCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  // Tabs & Review form state
  const [activeTab, setActiveTab] = useState("description");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [canReview, setCanReview] = useState(false);

  // Helper: compute star count (default 4 if no reviews)
  const getStarCount = (p) => {
    const rc = p?.review_count ?? 0;
    const ar = p?.avg_rating ?? 0;
    if (!rc) return 4;
    const val = Math.round(ar);
    return val > 0 ? val : 4;
  };

  // Helper: render stars only (no counts), size class customizable
  const renderStars = (count, size = "text-sm") => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`${size} ${i < count ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/products/detailProduct/${productId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch product detail");
        }
        const data = await response.json();
        setProduct(data.data);
        setMainImage(data.data?.avatar);

        // Chọn variant đầu tiên có stock > 0, nếu không có thì chọn variant đầu tiên
        if (data.data?.variants && data.data.variants.length > 0) {
          const availableVariant = data.data.variants.find((v) => v.stock > 0);
          setSelectedVariant(availableVariant || data.data.variants[0]);
        }

        // Fetch related products from same category
        if (data.data?.category_id) {
          try {
            const relatedResponse = await fetch(
              `http://localhost:5000/api/products/productByType/${data.data.category_id}`,
            );
            if (relatedResponse.ok) {
              const relatedData = await relatedResponse.json();
              setRelatedProducts(
                relatedData.data
                  ? relatedData.data
                      .filter((p) => p.id !== productId)
                      .slice(0, 3)
                  : [],
              );
            }
          } catch (err) {
            console.error("Error fetching related products:", err);
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching product detail:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Handle tab from query string
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "reviews") setActiveTab("reviews");
  }, [searchParams]);

  // Fetch reviews for product
  const fetchReviews = async (pid) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/reviews/product/${pid}`,
      );
      if (res.ok) {
        const data = await res.json();
        const list =
          data && data.data && Array.isArray(data.data.reviews)
            ? data.data.reviews
            : [];
        setProduct((prev) => (prev ? { ...prev, reviews: list } : prev));
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(productId);
    }
  }, [productId]);

  // Check if current user can review this product
  useEffect(() => {
    const check = async () => {
      if (!productId || !isAuthenticated() || !token) {
        setCanReview(false);
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:5000/api/reviews/canReview/${productId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setCanReview(Boolean(data?.data?.canReview));
        } else {
          setCanReview(false);
        }
      } catch {
        setCanReview(false);
      }
    };
    check();
  }, [productId, token, isAuthenticated]);

  const handleAddToCart = async () => {
    // Kiểm tra đăng nhập
    if (!isAuthenticated()) {
      const confirmLogin = window.confirm(
        "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Đăng nhập ngay?",
      );
      if (confirmLogin) {
        navigate("/auth/login");
      }
      return;
    }

    // Kiểm tra variant
    if (!selectedVariant) {
      alert("Vui lòng chọn một biến thể sản phẩm");
      return;
    }

    // Kiểm tra stock
    if (selectedVariant.stock <= 0) {
      alert("Sản phẩm này hiện đã hết hàng");
      return;
    }

    // Kiểm tra số lượng
    if (quantity <= 0) {
      alert("Số lượng phải lớn hơn 0");
      return;
    }

    // Kiểm tra số lượng không vượt quá stock
    if (quantity > selectedVariant.stock) {
      alert(`Số lượng không được vượt quá tồn kho (${selectedVariant.stock})`);
      return;
    }

    setAddingToCart(true);

    try {
      const userId = getUserId();

      const response = await fetch("http://localhost:5000/api/cart/addItem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          productVariantId: selectedVariant.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }

      if (data.success) {
        // Refresh cart count
        refreshCart();

        // Show modal
        setShowModal(true);
      } else {
        alert(data.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.message || "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      const confirmLogin = window.confirm(
        "Bạn cần đăng nhập để gửi đánh giá. Đăng nhập ngay?",
      );
      if (confirmLogin) navigate("/auth/login");
      return;
    }

    if (!productId) return;

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      alert("Vui lòng chọn số sao (1-5).");
      return;
    }

    const comment = reviewComment.trim();
    if (comment.length < 10) {
      alert("Bình luận tối thiểu 10 ký tự.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: Number(productId),
          rating: reviewRating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Không thể gửi đánh giá");
      }
      alert("Cảm ơn bạn đã đánh giá!");
      setReviewRating(0);
      setReviewComment("");
      await fetchReviews(productId);
    } catch (err) {
      console.error("Submit review error:", err);
      alert(err.message || "Đã xảy ra lỗi khi gửi đánh giá");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Lỗi: {error || "Không tìm thấy sản phẩm"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const price = selectedVariant?.price_sale || 0;
  const originalPrice = selectedVariant?.price || 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  // Reviews derived data (optional, if backend provides reviews later)
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? parseFloat(
        (
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviewCount
        ).toFixed(1),
      )
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length,
  );
  const ratingPercents = ratingCounts.map((c) =>
    reviewCount ? Math.round((c * 100) / reviewCount) : 0,
  );

  // Format time for each review (vi-VN)
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <button
              onClick={() => navigate("/")}
              className="hover:text-green-600"
            >
              TRANG CHỦ
            </button>
            <span>/</span>
            <button
              onClick={() => navigate("/products")}
              className="hover:text-green-600"
            >
              SẢN PHẨM
            </button>
            <span>/</span>
            <span className="text-gray-800 font-semibold line-clamp-1">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Left: Product Image */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg p-4 border border-gray-200 sticky top-20">
              {/* Main Image */}
              <div className="bg-gray-100 h-96 flex items-center justify-center text-8xl rounded-lg mb-4 overflow-hidden relative">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "📦"
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white font-bold text-2xl text-center">
                      HẾT HÀNG
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail images gallery */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* Main avatar thumbnail */}
                <div
                  onClick={() => {
                    setMainImage(product.avatar);
                    setSelectedImageIndex(0);
                  }}
                  className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded border-2 flex items-center justify-center cursor-pointer transition ${
                    selectedImageIndex === 0
                      ? "border-green-600 ring-2 ring-green-400"
                      : "border-gray-300 hover:border-green-600"
                  } overflow-hidden`}
                >
                  {product.avatar ? (
                    <img
                      src={product.avatar}
                      alt="main-avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>

                {/* Additional images from images JSON */}
                {product.images &&
                  (() => {
                    try {
                      const imageArray =
                        typeof product.images === "string"
                          ? JSON.parse(product.images)
                          : product.images;
                      return (
                        Array.isArray(imageArray) &&
                        imageArray.length > 0 &&
                        imageArray.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setMainImage(img);
                              setSelectedImageIndex(idx + 1);
                            }}
                            className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded border-2 flex items-center justify-center cursor-pointer transition ${
                              selectedImageIndex === idx + 1
                                ? "border-green-600 ring-2 ring-green-400"
                                : "border-gray-300 hover:border-green-600"
                            } overflow-hidden`}
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={`img-${idx}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                        ))
                      );
                    } catch (e) {
                      console.error("Error parsing images:", e);
                      return null;
                    }
                  })()}
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
              {/* Product Name */}
              <h1 className="text-2xl font-bold text-gray-800 mb-3">
                {product.name}
              </h1>

              {/* Rating (stars only) */}
              <div className="mb-2">
                {renderStars(getStarCount(product), "text-base")}
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-orange-500">
                  {price.toLocaleString("vi-VN")} ₫
                </span>
                {originalPrice > price && (
                  <span className="text-lg text-gray-400 line-through">
                    {originalPrice.toLocaleString("vi-VN")} ₫
                  </span>
                )}
              </div>

              {/* Seller Info */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                {/* <span className="text-sm text-gray-600">• GIÁ BẢN: LIÊN HỆ</span> */}
              </div>

              {/* Status */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tình trạng:</span>
                  {isOutOfStock ? (
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded font-semibold">
                      ✕ Hết hàng
                    </span>
                  ) : (
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded font-semibold">
                      ✓ Còn hàng
                    </span>
                  )}
                </div>
              </div>

              {/* Variants Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại sản phẩm <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.variants.map((variant) => {
                        const isVariantOutOfStock = variant.stock <= 0;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={isVariantOutOfStock}
                            onClick={() =>
                              !isVariantOutOfStock &&
                              setSelectedVariant(variant)
                            }
                            className={`p-3 border-2 rounded-lg transition font-semibold text-sm relative ${
                              isVariantOutOfStock
                                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                                : selectedVariant?.id === variant.id
                                  ? "border-green-600 bg-green-50 text-green-700"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-green-400"
                            }`}
                          >
                            <div className="text-center">
                              <p>{variant.name}</p>
                              <p className="text-xs text-orange-600 mt-1">
                                {variant.price_sale.toLocaleString("vi-VN")} ₫
                              </p>
                            </div>
                            {isVariantOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                                <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded">
                                  HẾT HÀNG
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selectedVariant && (
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      <p>
                        ✓ Đã chọn: <strong>{selectedVariant.name}</strong>
                      </p>
                      <p>
                        Giá:{" "}
                        {selectedVariant.price_sale.toLocaleString("vi-VN")} ₫
                      </p>
                      <p>
                        Tồn kho:{" "}
                        <strong
                          className={
                            selectedVariant.stock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {selectedVariant.stock}
                        </strong>{" "}
                        {selectedVariant.unit}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số lượng <span className="text-red-600">*</span>
                  {selectedVariant && selectedVariant.stock > 0 && (
                    <span className="text-xs text-gray-500 font-normal">
                      {" "}
                      (Tối đa: {selectedVariant.stock})
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-green-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      if (selectedVariant && val <= selectedVariant.stock) {
                        setQuantity(val);
                      }
                    }}
                    disabled={isOutOfStock}
                    className="w-16 h-10 border border-gray-300 rounded text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={() => {
                      if (selectedVariant && quantity < selectedVariant.stock) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={
                      isOutOfStock ||
                      (selectedVariant && quantity >= selectedVariant.stock)
                    }
                    className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-green-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || isOutOfStock}
                className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg hover:bg-green-700 transition mb-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isOutOfStock
                  ? "Hết hàng"
                  : addingToCart
                    ? "Đang thêm..."
                    : "Thêm vào giỏ hàng"}
              </button>

              {/* Social Share */}
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <span>Chia sẻ:</span>
                <button className="hover:text-blue-600">f</button>
                <button className="hover:text-blue-400">𝕏</button>
                <button className="hover:text-red-600">📌</button>
                <button className="hover:text-red-600">✉️</button>
                <button className="hover:text-blue-600">in</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`flex-1 px-4 py-3 text-center font-semibold ${activeTab === "description" ? "text-gray-700 bg-orange-400 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Mô tả
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 px-4 py-3 text-center font-semibold ${activeTab === "reviews" ? "text-gray-700 bg-orange-400 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  Đánh giá ({reviewCount})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "description" ? (
                  <>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      Mô tả sản phẩm
                    </h3>
                    <div
                      className="text-gray-600 text-sm leading-relaxed mb-4 markdown-content"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    />

                    {/* Product Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Xuất xứ:</span>
                        <span className="font-semibold text-gray-800">
                          {product.origin || "Việt Nam"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Hạn sử dụng:</span>
                        <span className="font-semibold text-gray-800">
                          {product.expiry_date || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Danh mục:</span>
                        <span className="font-semibold text-gray-800">
                          Sản phẩm từ Việt
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Rating summary */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4">
                      <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-800">
                            {avgRating ? avgRating.toFixed(1) : "0.0"}/5
                          </div>
                          <div className="text-yellow-400 text-xl">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>
                                {i < Math.round(avgRating) ? "★" : "☆"}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {reviewCount} đánh giá
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((star, idx) => (
                            <div key={star} className="flex items-center gap-3">
                              <span className="w-10 text-sm">{star} ★</span>
                              <div className="flex-1 bg-gray-200 rounded h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded"
                                  style={{ width: `${ratingPercents[idx]}%` }}
                                />
                              </div>
                              <span className="w-32 text-sm text-blue-600">
                                {ratingPercents[idx]}% | {ratingCounts[idx]}{" "}
                                đánh giá
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div
                        className={`border border-red-300 bg-red-50 text-red-600 p-3 rounded text-sm ${canReview ? "hidden" : ""}`}
                      >
                        Chỉ những khách hàng đã đăng nhập và mua sản phẩm này
                        mới có thể đưa ra đánh giá.
                      </div>
                    </div>

                    {/* Reviews list */}
                    {reviewCount === 0 ? (
                      <p className="text-sm text-gray-600">
                        Chưa có đánh giá nào.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((rv, i) => (
                          <div
                            key={i}
                            className="border-b border-gray-200 pb-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">
                                {rv.user_name || rv.name || "Người dùng"}
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(rv.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              {[...Array(5)].map((_, j) => (
                                <span key={j}>
                                  {j < (rv.rating || 0) ? "★" : "☆"}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {rv.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Category Sidebar */}
          <div className="col-span-1">
            {/* Category Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
              <h3 className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm mb-4 -mx-4 -mt-4 -mb-4 px-4 py-3">
                DANH MỤC SẢN PHẨM
              </h3>
              <div className="space-y-2 pt-4">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        navigate(`/products?category_id=${category.id}`)
                      }
                      className="block w-full text-left text-sm text-gray-700 hover:text-green-600 hover:font-semibold transition py-1"
                    >
                      {category.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Đang tải danh mục...</p>
                )}
              </div>
            </div>

            {/* Hot Products Section */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm mb-4 -mx-4 -mt-4 -mb-4 px-4 py-3">
                SẢN PHẨM ĐANG HOT
              </h3>
              <div className="space-y-3 pt-4">
                {relatedProducts.length > 0 ? (
                  relatedProducts.slice(0, 3).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => navigate(`/product/${prod.id}`)}
                      className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {prod.avatar ? (
                          <img
                            src={prod.avatar}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">
                          {prod.name}
                        </p>
                        <div>{renderStars(getStarCount(prod), "text-xs")}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Không có sản phẩm liên quan
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            SẢN PHẨM TƯƠNG TỰ
          </h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((prod) => {
                const prodPrice =
                  prod.variants && prod.variants.length > 0
                    ? prod.variants[0].price_sale
                    : 0;
                return (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="bg-gray-100 h-48 flex items-center justify-center overflow-hidden relative">
                      {prod.avatar ? (
                        <img
                          src={prod.avatar}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl">📦</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 line-clamp-1 text-center text-green-600">
                        {prod.name}
                      </h4>

                      {/* Price */}
                      <div className="text-center mb-3">
                        <span className="text-lg font-bold text-orange-500">
                          {prodPrice.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="flex justify-center mb-3">
                        {renderStars(getStarCount(prod), "text-sm")}
                      </div>

                      {/* Seller Info */}
                      {/* <p className="text-xs text-gray-600 text-center mb-3">• GIÁ BẢN: LIÊN HỆ</p> */}

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
                      >
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Không có sản phẩm tương tự</p>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showModal && (
        <AddToCartModal
          product={product}
          quantity={quantity}
          price={price}
          image={mainImage}
          variantName={selectedVariant?.name}
          onClose={() => setShowModal(false)}
          onViewCart={() => {
            setShowModal(false);
            navigate("/cart");
          }}
          onCheckout={() => {
            setShowModal(false);
            navigate("/checkout");
          }}
        />
      )}

      <style>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          font-weight: bold;
          margin: 12px 0 8px 0;
        }
        
        .markdown-content h1 {
          font-size: 24px;
          border-bottom: 2px solid #0d6efd;
          padding-bottom: 8px;
        }
        
        .markdown-content h2 {
          font-size: 20px;
        }
        
        .markdown-content h3 {
          font-size: 16px;
        }
        
        .markdown-content p {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        .markdown-content strong {
          font-weight: bold;
          color: #0d6efd;
        }
        
        .markdown-content em {
          font-style: italic;
        }
        
        .markdown-content code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 13px;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid #0d6efd;
          padding-left: 15px;
          margin: 10px 0;
          color: #666;
          font-style: italic;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          padding-left: 30px;
          margin: 10px 0;
        }
        
        .markdown-content li {
          margin: 5px 0;
        }
        
        .markdown-content a {
          color: #0d6efd;
          text-decoration: underline;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
}

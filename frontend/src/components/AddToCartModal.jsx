import React from 'react';

export default function AddToCartModal({
  product,
  quantity = 1,
  price = 0,
  image,
  variantName,
  onClose,
  onViewCart,
  onCheckout,
}) {
  const total = (Number(price) || 0) * (Number(quantity) || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white w-full max-w-xl rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 border-b border-green-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-sm">✓</span>
          <p className="font-semibold text-sm">Sản phẩm đã được thêm vào giỏ hàng</p>
        </div>

        {/* Close button */}
        <button
          aria-label="Đóng"
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 flex-shrink-0 rounded border border-gray-200 overflow-hidden bg-gray-100">
              {image ? (
                <img src={image} alt={product?.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">📦</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{product?.name}</p>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {variantName && (
                  <div className="flex items-center gap-2">
                    <span>Loại:</span>
                    <span className="font-semibold text-blue-600">{variantName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>Đơn giá:</span>
                  <span className="font-semibold text-orange-600">{Number(price).toLocaleString('vi-VN')} ₫</span>
                  <span className="text-gray-400">•</span>
                  <span>Số lượng:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-gray-600 font-medium">Tổng cộng:</span>
            <span className="font-bold text-orange-600">
              {Number(total).toLocaleString('vi-VN')} ₫
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={onViewCart}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
            >
              Xem giỏ hàng
            </button>
            <button
              onClick={onCheckout}
              className="bg-white border border-green-600 text-green-700 hover:bg-green-50 font-semibold py-2 rounded"
            >
              Thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


const reviewService = require('../services/reviewService');

class ReviewController {
  static async getProductReviews(req, res) {
    try {
      const productId = Number(req.params.productId);
      if (!productId) return res.status(400).json({ message: 'Thiếu productId' });

      const data = await reviewService.getReviewsForProduct(productId);
      return res.json({ message: 'OK', data });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('getProductReviews error:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }

  static async getCanReview(req, res) {
    try {
      const productId = Number(req.params.productId);
      const variantId = req.query.variantId ? Number(req.query.variantId) : undefined;
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });
      if (!productId) return res.status(400).json({ message: 'Thiếu productId' });

      const ok = await reviewService.canUserReview(userId, productId, variantId);
      return res.json({ message: 'OK', data: { canReview: ok } });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('getCanReview error:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }

  static async createOrUpdateReview(req, res) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

      const { productId, rating, comment, variantId } = req.body || {};
      const pid = Number(productId);
      const r = Number(rating);
      const vid = variantId ? Number(variantId) : undefined;

      if (!pid) return res.status(400).json({ message: 'Thiếu productId' });
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ message: 'Số sao không hợp lệ (1-5)' });
      // Bình luận là tùy chọn; nếu có nhưng quá ngắn (<3) thì báo lỗi, còn nếu không có thì dùng chuỗi rỗng
      if (comment !== undefined && String(comment).trim().length > 0 && String(comment).trim().length < 3) {
        return res.status(400).json({ message: 'Bình luận quá ngắn' });
      }

      const result = await reviewService.addOrUpdateReview(userId, pid, r, String(comment ?? '').trim(), vid);
      if (!result.ok && result.reason === 'NOT_ELIGIBLE') {
        return res.status(403).json({ message: 'Bạn chỉ có thể đánh giá những sản phẩm đã được giao trong đơn hàng của bạn.' });
      }

      return res.status(201).json({ message: 'Đã lưu đánh giá', data: result });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('createOrUpdateReview error:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }

  static async createOrUpdateReviewFromOrder(req, res) {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

      const { orderId, variantId, rating, comment } = req.body || {};
      const oid = Number(orderId);
      const vid = Number(variantId);
      const r = Number(rating);

      if (!oid || !vid) return res.status(400).json({ message: 'Thiếu orderId hoặc variantId' });
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ message: 'Số sao không hợp lệ (1-5)' });
      // Comment optional: allow empty, but if provided must be >=3 chars
      if (comment !== undefined && String(comment).trim().length > 0 && String(comment).trim().length < 3) {
        return res.status(400).json({ message: 'Bình luận quá ngắn' });
      }

      const result = await reviewService.addOrUpdateReviewFromOrder(userId, oid, vid, r, String(comment ?? '').trim());
      if (!result.ok) {
        if (result.reason === 'NOT_ELIGIBLE') {
          return res.status(403).json({ message: 'Chỉ có thể đánh giá sản phẩm thuộc đơn hàng đã giao của bạn.' });
        }
        if (result.reason === 'WINDOW_EXPIRED') {
          return res.status(403).json({ message: 'Đơn hàng đã quá hạn 30 ngày để đánh giá.' });
        }
      }

      return res.status(201).json({ message: 'Đã lưu đánh giá', data: result });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('createOrUpdateReviewFromOrder error:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }


  static async getOrderReviewStatus(req, res) {
    try {
      const userId = req.userId;
      const orderId = Number(req.params.orderId);
      if (!userId) return res.status(401).json({ message: 'Vui lòng đăng nhập' });
      if (!orderId) return res.status(400).json({ message: 'Thiếu orderId' });

      const status = await reviewService.getOrderReviewStatus(userId, orderId);
      if (!status.found) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      return res.json({ message: 'OK', data: status });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('getOrderReviewStatus error:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }

}

module.exports = ReviewController;


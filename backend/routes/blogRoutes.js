const express = require('express');
const blogController = require('../controllers/blogController');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

// Admin routes - must come before /:id route to avoid conflicts
router.get('/admin/all', authenticateToken, blogController.getAllBlogsAdmin);
router.post('/create', authenticateToken, blogController.createBlog);

// Public routes for search
router.get('/search', blogController.searchBlogs);
router.get('/category', blogController.getBlogsByCategory);
router.get('/about/page', blogController.getAboutPage); // Trang About
router.get('/distributor/page', blogController.getDistributorPage); // Trang Tuyển đại lý

// Public routes
router.get('/all', blogController.getAllBlogs);

// Admin routes with ID parameter
router.put('/:id', authenticateToken, blogController.updateBlog);
router.delete('/:id', authenticateToken, blogController.deleteBlog);

// Comment routes - require authentication
router.post('/:id/comments', authenticateToken, blogController.addComment);

// Get blog detail (public)
router.get('/:id', blogController.getBlogDetail);

module.exports = router;

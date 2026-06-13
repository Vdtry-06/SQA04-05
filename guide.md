# Cải thiện website thương mại điện tử và ứng dụng AI tăng cường chăm sóc khách hàng

## 1. Yêu cầu hệ thống

### 1.1 Mục tiêu dự án
Xây dựng lại website cho doanh nghiệp nhỏ và siêu nhỏ với giao diện và công nghệ hiện đại hơn, hướng tới:
- Trải nghiệm mượt mà, trực quan hơn cho người dùng, responsive trên cả PC và mobile.  
- Quản lý sản phẩm và đơn hàng dễ dàng cho nhân viên và quản trị viên. 
- Tích hợp công nghệ **AI Chatbot** hỗ trợ tư vấn món ăn, hỏi đáp.  
- Đề cao khả năng mở rộng trong tương lai   

## 1.2. Chức năng theo nhóm người dùng

### Khách vãng lai (Guest)
- Truy cập và xem **trang chủ**, **danh mục sản phẩm**, **chi tiết sản phẩm**.  
- Tìm kiếm, lọc sản phẩm.  
- Thêm sản phẩm vào giỏ hàng.  
- Thanh toán không cần tài khoản (guest checkout).  
- Trò chuyện với chatbot AI để hỏi về sản phẩm, món ăn gợi ý, chính sách.  
- Xem thông tin về trang web, liên hệ, chính sách, blog.

### Khách đã có tài khoản (Customer)
Bao gồm toàn bộ quyền của **Visitor**, cộng thêm:
- Đăng ký, đăng nhập, đăng xuất.  
- Cập nhật thông tin cá nhân, đổi mật khẩu.  
- Lưu địa chỉ giao hàng mặc định.  
- Xem lịch sử mua hàng, theo dõi trạng thái đơn hàng.  
- Đánh giá, bình luận sản phẩm.  

### Nhân viên (Staff)
Dành cho bộ phận vận hành nội bộ:
- Đăng nhập trang **Admin Dashboard (staff role)**.  
- Quản lý sản phẩm: thêm, sửa, ẩn/hiện sản phẩm.  
- Xử lý và xác nhận đơn hàng (đang xử lý, giao hàng, hoàn tất).  
- Quản lý thông tin khách hàng (xem danh sách, hỗ trợ khi cần).  
- Quản lý bài viết/blog, banner khuyến mãi.  
- Xem báo cáo đơn hàng, doanh thu cơ bản. 

### Quản trị viên (Admin)
Bao gồm toàn bộ quyền của **Staff**, cộng thêm:
- Quản lý phân quyền người dùng (tạo, khóa, gán vai trò).  
- Quản lý hệ thống (cấu hình, phương thức thanh toán, phí vận chuyển).  
- Quản lý danh mục sản phẩm, tag, combo, chương trình khuyến mãi.  
- Theo dõi thống kê chi tiết (doanh thu, traffic, sản phẩm bán chạy).  
- Giám sát log hệ thống, backup dữ liệu. 

## 1.3 Cấu trúc chức năng theo giao diện
| Giao diện | Chức năng chính | Người dùng được phép |
|------------|----------------|----------------------|
| **Trang chủ (Home)** | Hiển thị sản phẩm nổi bật, danh mục, banner khuyến mãi, chatbot AI | Tất cả |
| **Trang danh mục sản phẩm (Product List)** | Xem sản phẩm, lọc, tìm kiếm, sắp xếp | Tất cả |
| **Trang chi tiết sản phẩm (Product Detail)** | Xem mô tả, giá, ảnh, đánh giá, thêm vào giỏ hàng, chatbot gợi ý | Tất cả |
| **Trang giỏ hàng (Cart)** | Hiển thị sản phẩm đã chọn, chỉnh sửa số lượng, mã giảm giá | Tất cả |
| **Trang thanh toán (Checkout)** | Nhập thông tin giao hàng, chọn phương thức thanh toán, xác nhận đơn | Visitor, Customer |
| **Trang đăng nhập / đăng ký (Auth)** | Tạo tài khoản, đăng nhập, quên mật khẩu | Visitor |
| **Trang người dùng (User Profile)** | Xem và chỉnh sửa thông tin cá nhân, xem đơn hàng, đánh giá sản phẩm | Customer |
| **Trang chatbot (AI Assistant)** | Chat, hỏi món ăn, hỏi tình trạng đơn hàng, gợi ý sản phẩm | Tất cả |
| **Trang quản trị (Admin Dashboard)** | Quản lý sản phẩm, đơn hàng, người dùng, thống kê | Staff, Admin |
| **Trang cấu hình hệ thống (System Settings)** | Quản lý phân quyền, cài đặt thanh toán, sao lưu | Admin |

## 1.4 MVP
Cần làm trước những cái này
- Trang chủ, danh mục, chi tiết sản phẩm
- Giỏ hàng và thanh toán (COD)
- Trang người dùng: chỉnh sửa thông tin cá nhân
- Trang quản lý cơ bản: thêm/ sửa sản phẩm, xử lý đơn hàng

## 2. Các module chính
- Trang chủ, danh mục, chi tiết sản phẩm: hiển thị danh sách sản phẩm, lọc sản phẩm theo từ khoá/giá, xem chi tiết thông tin sản phẩm
- Giỏ hàng và thanh toán: quản lý giỏ hàng, tính tổng hoá đơn, lưu thông tin đơn hàng
- Trang quản lý cơ bản: thêm sửa sản phẩm, xử lý đơn hàng (đang xử lý, duyệt, đang giao, thành công) 

## 3. Mô tả giao diện
- Gắn link mô tả giao diện của Bepsachviet ở đây:... hoặc có thể chụp ảnh rồi code luôn

## 4. Công nghệ sử dụng

- **Frontend (Client):** ReactJS + CSS  
- **Backend (Server API):** Node.js (Express Framework)  
- **Database (Storage):** MySQL  

## 5. Thay đổi database 
- Tạo query mới trong mysql workbench và chạy đoạn script sau:
USE ecommerce_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS blog_comments;
DROP TABLE IF EXISTS blog_images;
DROP TABLE IF EXISTS blogs;

SET FOREIGN_KEY_CHECKS = 1;

-- Tạo lại theo schema bạn muốn
CREATE TABLE blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content LONGTEXT,
    category VARCHAR(50) DEFAULT 'general',
    thumbnail_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE blog_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_id INT,
    image_url VARCHAR(255),
    caption VARCHAR(255),
    FOREIGN KEY (blog_id) REFERENCES blogs(id)
);

CREATE TABLE blog_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_id INT,
    user_id INT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE contact_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    user_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE contact_requests ADD COLUMN status ENUM('pending', 'resolved') DEFAULT 'pending' AFTER message;
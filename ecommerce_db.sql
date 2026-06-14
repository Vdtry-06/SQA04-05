-- DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;
-- USERS & ROLES
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) -- admin, staff, customer
);

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- CATEGORIES (parent_id dùng để chia nhỏ categories: đồ uống -> cafe/nước ngọt)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    contact_info VARCHAR(255),
    address VARCHAR(255)
);

-- PRODUCTS
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    supplier_id INT,
    name VARCHAR(255),
    description TEXT,
    avatar VARCHAR(255),
    images TEXT,
    origin VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    name VARCHAR(100),
    unit VARCHAR(50),
    price_list DECIMAL(10,2),
    price_sale DECIMAL(10,2),
    stock INT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- CARTS & CART ITEMS
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT,
    product_variant_id INT,
    quantity INT,
    FOREIGN KEY (cart_id) REFERENCES carts(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- ORDERS & ORDER ITEMS
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_price DECIMAL(10,2),
    status VARCHAR(50), -- pending, paid, shipping, delivered, canceled
    payment_status VARCHAR(50), -- unpaid, paid, refunded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_variant_id INT,
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- BILLS
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    tax_number VARCHAR(100),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    issued_date DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- SHIPMENTS
CREATE TABLE shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    shipped_date DATETIME,
    delivered_date DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- REVIEWS
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    rating INT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- FAVORITES
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- PASSWORD RESETS
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

USE ecommerce_db;
-- BLOGS
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

-- BLOG IMAGES (ảnh minh hoạ bổ sung cho bài viết)
CREATE TABLE blog_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blog_id INT,
    image_url VARCHAR(255),
    caption VARCHAR(255),
    FOREIGN KEY (blog_id) REFERENCES blogs(id)
);

-- BLOG COMMENTS (người dùng bình luận bài viết)
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
ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL;
ALTER TABLE orders ADD COLUMN note TEXT NULL;
USE ecommerce_db;
-- ROLES
INSERT INTO roles (name) VALUES 
('admin'),
('staff'),
('customer');

-- USERS
INSERT INTO users (name, email, password, phone) VALUES
('Nguyen Van A', 'admin@example.com', '123456', '0901111222'),
('Tran Thi B', 'staff@example.com', '123456', '0903333444'),
('Le Van C', 'customer@example.com', '123456', '0905555666');

-- USER ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin
(2, 2), -- staff
(3, 3); -- customer

-- CATEGORIES
INSERT INTO categories (name) VALUES
('Sản phẩm từ vịt'),
('Sản phẩm từ gà'),
('Sản phẩm từ heo'),
('Sản phẩm từ cá'),
('Hải sản'),
('Các loại hạt'),
('Các loại ruốc'),
('Thực phẩm khác');

-- SUPPLIERS
INSERT INTO suppliers (name, contact_info, address) VALUES
('Công ty XYZ', '0987654321', 'TP. Hồ Chí Minh'),
('Công ty DEF', '0912345678', 'Hải Phòng'),
('Công ty GHI', '0934567890', 'Đà Nẵng');

-- PRODUCTS
-- SẢN PHẨM TỪ VỊT
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(1, 1, 'Đặc sản Vân Đình chả vịt Thuỷ Mạnh', 'Chả vịt thơm ngon đặc sản thương hiệu Thuỷ Mạnh', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728061/cha-vit-thuy-manh-1_cje2h1.jpg', 'Việt Nam', '2026-12-31', 'active'),
(1, 1, 'Chân vịt rút xương ủ xì dầu', 'Chân vịt rút xương ủ xì dầu ngon đậm vị', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728059/chan-vit-rut-xuong-u-xi-dau-1_zcaawp.jpg', 'Việt Nam', '2026-12-31', 'active'),
(1, 1, 'Chân vịt rút xương ủ muối', 'Chân vịt ủ muối đặc sản', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728060/chan-vit-u-muoi-1_lewhg8.jpg', 'Việt Nam', '2026-12-31', 'active'),
(1, 1, 'Đặc sản pate gan vịt', 'Pate gan vịt béo ngậy, thơm ngon', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729699/pate-gan-vit-1_luqpxa.jpg', 'Việt Nam', '2026-12-31', 'active'),
(1, 1, 'Đặc sản Vân Đình: Vịt ủ xì dầu', 'Vịt ủ xì dầu nguyên con', 'https://bepsachviet.com/wp-content/uploads/2024/01/VIT-U-XI-DAU-1.png', 'Việt Nam', '2026-12-31', 'active'),
(1, 1, 'Đặc sản mọc vịt Vân Đình', 'Mọc vịt dai mềm, đậm vị', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729220/moc-vit-1_a1qoz8.png', 'Việt Nam', '2026-12-31', 'active');

-- SẢN PHẨM TỪ GÀ
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(2, 1, 'Gà ủ muối', 'Gà ủ muối giữ nguyên vị ngọt tự nhiên', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728124/GA-U-MUOI-1_gdawtr.png', 'Việt Nam', '2026-12-31', 'active'),
(2, 1, 'Gà ủ xì dầu', 'Gà ủ xì dầu đậm đà chuẩn vị', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728418/ga-u-xi-dau-1_zxeur4.jpg', 'Việt Nam', '2026-12-31', 'active');

-- SẢN PHẨM TỪ HEO
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(3, 1, 'Chân giò giả cầy', 'Chân giò heo nấu giả cầy hương vị Bắc', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728059/chan-gio-gia-cay-1_prza9x.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Tai heo cuộn lưỡi', 'Tai heo cuộn lưỡi giòn dai hấp dẫn', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761789806/tai-heo-cuon-luoi-1_iq5zpt.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Tai heo ủ muối', 'Tai heo ủ muối thơm ngon', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761789890/tai-heo-u-muoi-02-280x280_vrozjf.png', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Tai heo ủ xì dầu', 'Tai heo ủ xì dầu chuẩn vị', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761789950/taiheouxidau-1_ev6cxv.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Thịt chưng mắm tép', 'Thịt chưng mắm tép đặc sản Hà Nội', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761790009/THIT-CHUNG-MAM-TEP-1_mi42za.png', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Nem lụi Nha Trang', 'Nem lụi nướng chuẩn vị Nha Trang', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729698/nem-lui-nha-trang-1_aznscq.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Nem rán Hà Nội', 'Nem rán Hà Nội giòn rụm', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729699/nem-ran-ha-noi-1_e1kvew.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Đặc sản chả cốm Hà Nội', 'Chả cốm truyền thống Hà Nội', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728061/DAC-SAN-CHA-COM-HN-1_h4hj6j.png', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Khâu nhục Lạng Sơn', 'Đặc sản khâu nhục thơm mềm', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729220/KHAU-NHUC-LANG-SON-1_p3yrlg.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Đặc sản chả chìa Hải Phòng', 'Đặc sản chả chìa Hải Phòng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728059/cha-chia-hai-phong-1_lxz1ot.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Đặc sản chả sụn', 'Chả sụn giòn tan hấp dẫn', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728060/chasun1-280x280_v89y5i.jpg', 'Việt Nam', '2026-12-31', 'active'),
(3, 1, 'Xúc xích cốm', 'Xúc xích vị cốm Hà Nội độc đáo', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761790398/XUC-XICH-COM-1_via4dx.png', 'Việt Nam', '2026-12-31', 'active');

-- SẢN PHẨM TỪ CÁ
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(4, 1, 'Chả cá thác lác Hậu Giang', 'Đặc sản chả cá thác lác Hậu Giang', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728057/cha-ca-thac-lac-hau-giang-1_m7dwvw.png', 'Việt Nam', '2026-12-31', 'active'),
(4, 1, 'Chả cá thác lác tươi', 'Chả cá thác lác tươi dai mềm', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728057/CHA-CA-THAC-LAC-TUOI-1_xs94hm.png', 'Việt Nam', '2026-12-31', 'active'),
(4, 1, 'Chả cá thác lác tươi tẩm gia vị', 'Chả cá thác lác ướp sẵn tiện dụng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728058/cha-ca-thac-lac-tuoi-tam-gia-vi-1_tohcwy.jpg', 'Việt Nam', '2026-12-31', 'active');

-- HẢI SẢN
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(5, 1, 'Chả mực Hạ Long', 'Đặc sản chả mực giã tay Hạ Long', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728059/cha-muc-ha-long-1_cepn5v.png', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Chả mo ghẹ', 'Chả mo ghẹ thơm béo', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728059/cha-mo-ghe-1_x47qao.png', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Nem hải sản', 'Nem hải sản tươi ngon, giòn rụm', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729253/nem-hai-san-1_dlev0d.png', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Chả cá mỏng', 'Chả cá mỏng giòn ngon, chiên sẵn', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728058/cha-ca-mong-1_onan1x.png', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Chả cá mực tôm', 'Chả cá mực tôm tươi ngon', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728058/cha-ca-muc-tom-1_gmwhf5.png', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Chả cá', 'Chả cá làm từ cá tươi trong ngày', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728057/cha-ca-1_ekdpnj.jpg', 'Việt Nam', '2026-12-31', 'active'),
(5, 1, 'Chả tôm', 'Chả tôm thơm ngon bổ dưỡng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728060/cha-tom-1_s7nt8z.jpg', 'Việt Nam', '2026-12-31', 'active');

-- CÁC LOẠI HẠT
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(6, 1, 'Hạnh nhân sấy', 'Hạnh nhân sấy giòn, dinh dưỡng cao', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728419/hanh-nhan-say-1_kwes0q.jpg', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Hạt điều bể sữa', 'Hạt điều rang sữa béo nhẹ', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728420/hat-dieu-be-sua-1_exsid0.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Hạt điều xếp hoa', 'Hạt điều sấy xếp hình hoa sang trọng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728420/hat-dieu-xep-hoa-1_oi4kcu.jpg', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Hạt macca vip', 'Hạt macca loại thượng hạng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728462/hat-macca-vip-1_ip6lnu.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Hạt óc chó đỏ', 'Hạt óc chó đỏ bổ dưỡng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729220/hat-oc-cho-do-1_umcyku.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Hạt óc chó vàng', 'Hạt óc chó vàng vị bùi béo', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729221/hat-oc-cho-vang-1_mglvbd.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Mix hạt', 'Hỗn hợp các loại hạt dinh dưỡng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729221/mix-hat-1_aq5qft.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Thanh rong biển kẹp hạt', 'Thanh rong biển kết hợp hạt dinh dưỡng', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761791371/thanh-rong-bien-kep-hat_fiqal0.jpg', 'Việt Nam', '2026-12-31', 'active'),
(8, 1, 'Xoài sấy dẻo', 'Xoài sấy dẻo chua ngọt tự nhiên', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761791411/xoai-say-deo-1_qwn3ij.png', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Bánh thanh hạnh nhân', 'Bánh thanh hạnh nhân giòn tan', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728057/banh-thanh-hanh-nhan_za8kfq.jpg', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Bánh thuyền hạnh nhân', 'Bánh thuyền hạnh nhân thơm béo', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728056/banh-thuyen-hanh-nhan-1_n9bdqq.jpg', 'Việt Nam', '2026-12-31', 'active'),
(6, 1, 'Bánh thuyền macca', 'Bánh thuyền nhân macca cao cấp', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728057/banh-thuyen-macca-1_xzjgt0.jpg', 'Việt Nam', '2026-12-31', 'active');

-- CÁC LOẠI RUỐC
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(7, 1, 'Ruốc tôm', 'Ruốc tôm vàng giòn', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761791570/Ruoc-tom-1_dvxbd2.jpg', 'Việt Nam', '2026-12-31', 'active'),
(7, 1, 'Ruốc bề bề', 'Ruốc bề bề đặc sản biển', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729714/ruoc-be-be-1_off8ga.jpg', 'Việt Nam', '2026-12-31', 'active'),
(7, 1, 'Ruốc tôm rong biển', 'Ruốc tôm kết hợp rong biển', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761791605/Ruoc-tom-rong-bien-1_dxfg6e.jpg', 'Việt Nam', '2026-12-31', 'active'),
(7, 1, 'Ruốc cá thu', 'Ruốc cá thu thơm ngon', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729752/ruoc-ca-thu-1_c2jjma.jpg', 'Việt Nam', '2026-12-31', 'active');

-- THỰC PHẨM KHÁC
INSERT INTO products (category_id, supplier_id, name, description, avatar, origin, expiry_date, status) VALUES
(8, 1, 'Chả ốc ống nứa', 'Chả ốc hấp trong ống nứa độc đáo', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728060/cha-oc-ong-nua-1_i6cjll.png', 'Việt Nam', '2026-12-31', 'active'),
(8, 1, 'Gân bò trộn rau tiến vua', 'Gân bò trộn rau tiến vua giòn mát', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761728083/gan-bo-tron-rau-tien-vua-1_syswkx.png', 'Việt Nam', '2026-12-31', 'active'),
(8, 1, 'Mọc ốc', 'Mọc ốc hấp dẫn, ăn kèm bún', 'https://res.cloudinary.com/dpq4bt42x/image/upload/v1761729220/moc-oc-1_sw6spt.png', 'Việt Nam', '2026-12-31', 'active');

-- PRODUCT VARIANTS
-- 🦆 SẢN PHẨM TỪ VỊT
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(1, 'Phần 0.5kg', 'kg', 160000, 150000, 60),
(2, 'Phần 0.5kg', 'kg', 155000, 145000, 70),
(3, 'Phần 0.5kg', 'kg', 155000, 145000, 70),
(4, 'Hũ 200g', 'hũ', 95000, 90000, 100),
(5, 'Con 1.2kg', 'con', 330000, 310000, 40),
(6, 'Gói 500g', 'kg', 145000, 135000, 80);

-- =======================================================
-- 🐔 SẢN PHẨM TỪ GÀ
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(7, 'Con 1.2kg', 'con', 320000, 300000, 50),
(8, 'Con 1.2kg', 'con', 340000, 315000, 45);

-- =======================================================
-- 🐖 SẢN PHẨM TỪ HEO
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(9, 'Phần 0.5kg', 'kg', 160000, 150000, 60),
(10, 'Phần 0.5kg', 'kg', 155000, 145000, 65),
(11, 'Phần 0.5kg', 'kg', 155000, 145000, 65),
(12, 'Phần 0.5kg', 'kg', 160000, 150000, 60),
(13, 'Hũ 200g', 'hũ', 85000, 80000, 100),
(14, 'Que 200g', 'que', 85000, 80000, 80),
(15, 'Gói 500g', 'gói', 120000, 110000, 90),
(16, 'Gói 500g', 'gói', 95000, 90000, 100),
(17, 'Hộp 500g', 'hộp', 135000, 125000, 60),
(18, 'Phần 0.5kg', 'kg', 175000, 165000, 70),
(19, 'Gói 500g', 'gói', 160000, 150000, 60),
(20, 'Gói 500g', 'gói', 95000, 90000, 120);

-- =======================================================
-- 🐟 SẢN PHẨM TỪ CÁ
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(21, 'Gói 0.5kg', 'kg', 130000, 120000, 80),
(22, 'Gói 0.5kg', 'kg', 125000, 115000, 75),
(23, 'Gói 0.5kg', 'kg', 135000, 125000, 70);

-- =======================================================
-- 🦑 HẢI SẢN
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(24, 'Gói 0.5kg', 'kg', 240000, 230000, 50), -- Chả mực Hạ Long
(25, 'Gói 0.5kg', 'kg', 210000, 200000, 60), -- Chả mo ghẹ
(26, 'Phần 0.5kg', 'kg', 180000, 170000, 80), -- Nem hải sản
(27, 'Gói 0.5kg', 'kg', 130000, 120000, 100), -- Chả cá mỏng
(28, 'Gói 0.5kg', 'kg', 145000, 135000, 90),  -- Chả cá mực tôm
(29, 'Gói 0.5kg', 'kg', 125000, 115000, 85),  -- Chả cá
(30, 'Gói 0.5kg', 'kg', 135000, 125000, 70);  -- Chả tôm

-- =======================================================
-- 🥜 CÁC LOẠI HẠT
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(31, 'Túi 250g', 'túi', 110000, 100000, 100), -- Hạnh nhân sấy
(32, 'Hộp 300g', 'hộp', 120000, 110000, 100), -- Hạt điều bể sữa
(33, 'Hộp 300g', 'hộp', 130000, 120000, 90),  -- Hạt điều xếp hoa
(34, 'Túi 250g', 'túi', 160000, 150000, 80),  -- Hạt macca vip
(35, 'Hộp 300g', 'hộp', 140000, 130000, 90),  -- Hạt óc chó đỏ
(36, 'Hộp 300g', 'hộp', 140000, 130000, 90),  -- Hạt óc chó vàng
(37, 'Túi 250g', 'túi', 120000, 110000, 90),  -- Mix hạt
(38, 'Hộp 200g', 'hộp', 90000, 85000, 100),   -- Thanh rong biển kẹp hạt
(39, 'Túi 250g', 'túi', 95000, 90000, 100),   -- Xoài sấy dẻo
(40, 'Hộp 250g', 'hộp', 95000, 90000, 80),    -- Bánh thanh hạnh nhân
(41, 'Hộp 250g', 'hộp', 100000, 95000, 80),   -- Bánh thuyền hạnh nhân
(42, 'Hộp 250g', 'hộp', 105000, 99000, 70);   -- Bánh thuyền macca

-- =======================================================
-- 🐟 CÁC LOẠI RUỐC
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(43, 'Hũ 100g', 'hũ', 65000, 60000, 150),  -- Ruốc tôm
(44, 'Hũ 100g', 'hũ', 70000, 65000, 130),  -- Ruốc bề bề
(45, 'Hũ 100g', 'hũ', 80000, 75000, 100),  -- Ruốc tôm rong biển
(46, 'Hũ 100g', 'hũ', 75000, 70000, 120);  -- Ruốc cá thu

-- =======================================================
-- 🍱 THỰC PHẨM KHÁC
-- =======================================================
INSERT INTO product_variants (product_id, name, unit, price_list, price_sale, stock) VALUES
(47, 'Phần 0.5kg', 'kg', 170000, 160000, 60), -- Chả ốc ống nứa
(48, 'Hộp 300g', 'hộp', 140000, 130000, 70), -- Gân bò trộn rau tiến vua
(49, 'Gói 250g', 'gói', 120000, 110000, 80); -- Mọc ốc

-- CARTS
INSERT INTO carts (user_id) VALUES (3);

-- CART ITEMS
INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES
(1, 1, 2);

-- ORDERS
INSERT INTO orders (user_id, total_price, status, payment_status, shipping_address, payment_method, note) VALUES
(1, 1380000, 'delivered', 'paid', '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'COD', 'Giao hàng giờ hành chính'),
(1, 850000, 'shipping', 'paid', '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'COD', 'Gọi trước khi giao'),
(3, 600000, 'pending', 'unpaid', '456 Lê Lợi, Quận 1, TP.HCM', 'COD', NULL),
(2, 1430000, 'delivered', 'paid', '789 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', 'COD', 'Để ở bảo vệ nếu không có người');

-- ORDER ITEMS
INSERT INTO order_items (order_id, product_variant_id, quantity, price) VALUES
(2, 5, 1, 310000),
(2, 10, 2, 145000),
(2, 25, 1, 200000),
(2, 34, 2, 150000),
(2, 46, 4, 70000),
(3, 7, 1, 300000),
(3, 24, 1, 230000),
(3, 31, 3, 100000);

-- REVIEWS
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(3, 1, 5, 'Nước ngọt uống rất ngon!'),
(3, 2, 4, 'Cà phê thơm nhưng hơi đắng.');

-- FAVORITES
INSERT INTO favorites (user_id, product_id) VALUES
(3, 1);

-- BLOGS
INSERT INTO blogs (title, thumbnail_image, content) VALUES
('Mẹo bảo quản nước ngọt', 'blog1.jpg', '<p>Để nước ngọt luôn ngon, nên bảo quản ở nhiệt độ mát...</p>'),
('Cách pha cà phê ngon', 'blog2.jpg', '<p>Pha cà phê chuẩn cần có nước sôi và tỉ lệ hợp lý...</p>');

-- BLOG IMAGES
INSERT INTO blog_images (blog_id, image_url, caption) VALUES
(1, 'blog1_img1.jpg', 'Tủ lạnh bảo quản nước ngọt'),
(2, 'blog2_img1.jpg', 'Ly cà phê buổi sáng');

-- BLOG COMMENTS
INSERT INTO blog_comments (blog_id, user_id, content) VALUES
(1, 3, 'Bài viết hữu ích, cảm ơn!'),
(2, 3, 'Mình hay pha nhưng chưa chuẩn, sẽ thử cách này.');

-- Thêm shipments cho các đơn hàng
INSERT INTO shipments (order_id, tracking_number, carrier, shipped_date, delivered_date) VALUES
(2, 'VN-2025-001', 'Giao Hàng Nhanh', '2025-10-20 10:00:00', '2025-10-22 14:30:00'),
(3, 'VN-2025-002', 'Giao Hàng Tiết Kiệm',  '2025-10-28 09:00:00', NULL),
(4, 'VN-2025-003', 'ViettelPost',  '2025-10-15 08:30:00', '2025-10-17 16:00:00');

INSERT INTO bills (order_id, tax_number, tax_amount, total_amount, issued_date) VALUES
(2, 'HD-2025-001', 138000, 1518000, '2025-10-22 14:30:00'),
(4, 'HD-2025-002', 143000, 1573000, '2025-10-17 16:00:00');


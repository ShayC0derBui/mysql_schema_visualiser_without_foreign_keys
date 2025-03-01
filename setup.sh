#!/bin/bash

# Stop and remove any existing container/volume
docker-compose down -v

# Recreate the init directory
rm -rf init
mkdir -p init

# Write the fixed schema to init/01-schema.sql
cat > init/01-schema.sql << 'EOF'
-- Create a sample e-commerce database schema with pluralized foreign keys

-- Users table
CREATE TABLE users (
    users_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product categories
CREATE TABLE categories (
    categories_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    -- Renamed to match "categories" for relationships
    parent_categories_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    products_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    -- Renamed to match "categories"
    categories_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    orders_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "users"
    users_id INT NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items (products in an order)
CREATE TABLE order_items (
    order_items_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "orders" and "products"
    orders_id INT NOT NULL,
    products_id INT NOT NULL,
    quantity INT NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart
CREATE TABLE cart_items (
    cart_items_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "users" and "products"
    users_id INT NOT NULL,
    products_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product reviews
CREATE TABLE reviews (
    reviews_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "products" and "users"
    products_id INT NOT NULL,
    users_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE addresses (
    addresses_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "users"
    users_id INT NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE coupons (
    coupons_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percent DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    min_purchase_amount DECIMAL(10, 2),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order coupons
CREATE TABLE order_coupons (
    order_coupons_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Renamed to match "orders" and "coupons"
    orders_id INT NOT NULL,
    coupons_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# Write the sample data with updated column names to init/02-sample-data.sql
cat > init/02-sample-data.sql << 'EOF'
-- Sample data insertion

INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES 
('johndoe', 'john@example.com', 'hashed_password_1', 'John', 'Doe'),
('janedoe', 'jane@example.com', 'hashed_password_2', 'Jane', 'Doe'),
('mikebrown', 'mike@example.com', 'hashed_password_3', 'Mike', 'Brown');

INSERT INTO categories (name, description, parent_categories_id)
VALUES 
('Electronics', 'Electronic devices and accessories', NULL),
('Smartphones', 'Mobile phones and accessories', 1),
('Laptops', 'Portable computers', 1),
('Clothing', 'Apparel and fashion items', NULL),
('Men''s Clothing', 'Clothing for men', 4),
('Women''s Clothing', 'Clothing for women', 4);

INSERT INTO products (name, description, price, stock_quantity, categories_id)
VALUES 
('iPhone 13', '128GB, Black', 799.99, 50, 2),
('Samsung Galaxy S21', '256GB, Silver', 749.99, 30, 2),
('MacBook Pro 14"', 'M1 Pro, 16GB RAM, 512GB SSD', 1999.99, 15, 3),
('Dell XPS 13', 'Intel i7, 16GB RAM, 512GB SSD', 1499.99, 20, 3),
('Men''s Casual T-Shirt', '100% Cotton, Blue', 24.99, 100, 5),
('Women''s Summer Dress', 'Floral Pattern, Size M', 49.99, 75, 6);

INSERT INTO orders (users_id, status, total_amount, shipping_address)
VALUES
(1, 'delivered', 849.98, '123 Main St, New York, NY 10001'),
(2, 'processing', 1999.99, '456 Oak Ave, Los Angeles, CA 90001'),
(3, 'pending', 74.98, '789 Pine Rd, Chicago, IL 60007');

INSERT INTO order_items (orders_id, products_id, quantity, price_per_unit)
VALUES
(1, 1, 1, 799.99),
(1, 5, 2, 24.99),
(2, 3, 1, 1999.99),
(3, 5, 3, 24.99);

INSERT INTO cart_items (users_id, products_id, quantity)
VALUES
(1, 2, 1),
(2, 4, 1),
(2, 6, 2);

INSERT INTO reviews (products_id, users_id, rating, comment)
VALUES
(1, 2, 5, 'Great phone, love the camera!'),
(3, 1, 4, 'Excellent performance, but battery life could be better'),
(5, 3, 5, 'Very comfortable material and perfect fit');

INSERT INTO addresses (users_id, address_line1, city, postal_code, country, is_default)
VALUES
(1, '123 Main St', 'New York', '10001', 'USA', TRUE),
(2, '456 Oak Ave', 'Los Angeles', '90001', 'USA', TRUE),
(3, '789 Pine Rd', 'Chicago', '60007', 'USA', TRUE);

INSERT INTO coupons (code, discount_percent, min_purchase_amount, start_date, end_date)
VALUES
('SUMMER25', 25.00, 100.00, '2025-01-01 00:00:00', '2025-06-30 23:59:59'),
('WELCOME10', 10.00, 50.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59');
EOF

# Write docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql_schema_visualizer
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: sample_db
      MYSQL_USER: user
      MYSQL_PASSWORD: userpass
    ports:
      - "3306:3306"
    volumes:
      - ./init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost", "-u", "root", "-ppassword"]
      interval: 5s
      timeout: 5s
      retries: 20
EOF

# Write config.ini
cat > config.ini << 'EOF'
[mysql]
host = localhost
user = user
password = userpass
database = sample_db
port = 3306
EOF

# Start up the container in the background
docker-compose up -d

echo "Waiting for MySQL to initialize..."
# Give MySQL some time to finish init scripts
sleep 30

# Drop and recreate the database to ensure a clean start
docker exec -i mysql_schema_visualizer mysql -u root -ppassword -e "DROP DATABASE IF EXISTS sample_db; CREATE DATABASE sample_db;"

# Load the fixed schema
docker exec -i mysql_schema_visualizer mysql -u root -ppassword sample_db < init/01-schema.sql

# Load the sample data
docker exec -i mysql_schema_visualizer mysql -u root -ppassword sample_db < init/02-sample-data.sql

echo "Setup complete!"
echo "MySQL is running. You can now run your schema visualizer script and see the relationships."


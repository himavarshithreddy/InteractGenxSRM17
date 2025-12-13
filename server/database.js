const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const LOG_PATH = path.join(__dirname, '..', '.cursor', 'debug.log');

const logDebug = (location, message, data, hypothesisId) => {
  try {
    const logEntry = JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId
    }) + '\n';
    fs.appendFileSync(LOG_PATH, logEntry);
  } catch (e) {}
};

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Operations - Orders
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Operations - Customers
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        total_orders INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Marketing - Campaigns
      db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        budget REAL DEFAULT 0,
        spent REAL DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Marketing - Promotions
      db.run(`CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        max_discount REAL,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Inventory - Products
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Inventory - Stock Movements
      db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`);

      // Logistics - Shipments
      db.run(`CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        tracking_number TEXT UNIQUE,
        carrier TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        origin_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        estimated_delivery DATE,
        actual_delivery DATE,
        shipping_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )`);

      // Logistics - Warehouses
      db.run(`CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        current_stock INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Analytics - Daily Stats
      db.run(`CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        revenue REAL DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        customers_count INTEGER DEFAULT 0,
        products_sold INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Users - Admin Users
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        status TEXT DEFAULT 'active',
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // User Preferences
      db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'en',
        timezone TEXT DEFAULT 'UTC',
        date_format TEXT DEFAULT 'MM/DD/YYYY',
        time_format TEXT DEFAULT '12h',
        notifications_enabled INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 1,
        dashboard_layout TEXT DEFAULT 'default',
        items_per_page INTEGER DEFAULT 25,
        default_view TEXT DEFAULT 'table',
        favorite_modules TEXT,
        custom_settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id)
      )`);

      // User Activity History
      db.run(`CREATE TABLE IF NOT EXISTS user_activity_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        module TEXT,
        entity_type TEXT,
        entity_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // User Sessions
      db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
          reject(err);
        } else {
          console.log('Database tables created successfully');
          seedData().then(resolve).catch(reject);
        }
      });
    });
  });
};

 const seedData = () => {
   return new Promise((resolve, reject) => {
     // #region agent log
     logDebug('server/database.js:175', 'Starting seedData check', {}, 'E');
     // #endregion
     db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
       // #region agent log
       logDebug('server/database.js:178', 'Orders count check result', {error:err?.message,orderCount:row?.count}, 'E');
       // #endregion
       if (err) {
         reject(err);
         return;
       }
       
       if (row.count === 0) {
         console.log('Seeding database with initial data...');
         // #region agent log
         logDebug('server/database.js:183', 'Will seed database', {orderCount:row.count}, 'A');
         // #endregion
        
        // Helper function to run inserts sequentially
        const runSequentially = (operations, callback) => {
          if (operations.length === 0) {
            callback();
            return;
          }
          const [operation, ...rest] = operations;
          operation((err) => {
            if (err) {
              reject(err);
              return;
            }
            runSequentially(rest, callback);
          });
        };

        // Seed Orders first (needed for shipments foreign key) - 15 entries
        const orders = [
          ['ORD-001', 'John Doe', 'john@example.com', 299.99, 'completed', 'paid'],
          ['ORD-002', 'Jane Smith', 'jane@example.com', 149.50, 'processing', 'paid'],
          ['ORD-003', 'Bob Johnson', 'bob@example.com', 89.99, 'pending', 'unpaid'],
          ['ORD-004', 'Alice Brown', 'alice@example.com', 450.00, 'shipped', 'paid'],
          ['ORD-005', 'Charlie Wilson', 'charlie@example.com', 199.99, 'completed', 'paid'],
          ['ORD-006', 'David Lee', 'david@example.com', 329.99, 'completed', 'paid'],
          ['ORD-007', 'Emma Davis', 'emma@example.com', 179.50, 'processing', 'paid'],
          ['ORD-008', 'Frank Miller', 'frank@example.com', 249.99, 'shipped', 'paid'],
          ['ORD-009', 'Grace Taylor', 'grace@example.com', 399.00, 'pending', 'unpaid'],
          ['ORD-010', 'Henry White', 'henry@example.com', 159.99, 'completed', 'paid'],
          ['ORD-011', 'Ivy Martinez', 'ivy@example.com', 279.50, 'processing', 'paid'],
          ['ORD-012', 'Jack Anderson', 'jack@example.com', 89.99, 'shipped', 'paid'],
          ['ORD-013', 'Kate Thompson', 'kate@example.com', 549.99, 'completed', 'paid'],
          ['ORD-014', 'Liam Garcia', 'liam@example.com', 199.50, 'pending', 'unpaid'],
          ['ORD-015', 'Mia Rodriguez', 'mia@example.com', 379.99, 'completed', 'paid'],
        ];
        
        const orderOps = orders.map(order => (callback) => {
          db.run(
            'INSERT INTO orders (order_number, customer_name, customer_email, total_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
            order,
            callback
          );
        });

        // Seed Customers - 15 entries
        const customers = [
          ['John Doe', 'john@example.com', '+1234567890', 5, 1250.50, 'active'],
          ['Jane Smith', 'jane@example.com', '+1234567891', 3, 450.00, 'active'],
          ['Bob Johnson', 'bob@example.com', '+1234567892', 1, 89.99, 'active'],
          ['Alice Brown', 'alice@example.com', '+1234567893', 8, 2100.00, 'active'],
          ['Charlie Wilson', 'charlie@example.com', '+1234567894', 2, 399.98, 'active'],
          ['David Lee', 'david@example.com', '+1234567895', 4, 980.00, 'active'],
          ['Emma Davis', 'emma@example.com', '+1234567896', 6, 1450.50, 'active'],
          ['Frank Miller', 'frank@example.com', '+1234567897', 2, 499.98, 'active'],
          ['Grace Taylor', 'grace@example.com', '+1234567898', 7, 1890.00, 'active'],
          ['Henry White', 'henry@example.com', '+1234567899', 3, 679.97, 'active'],
          ['Ivy Martinez', 'ivy@example.com', '+1234567900', 5, 1120.50, 'active'],
          ['Jack Anderson', 'jack@example.com', '+1234567901', 1, 89.99, 'active'],
          ['Kate Thompson', 'kate@example.com', '+1234567902', 9, 2450.00, 'active'],
          ['Liam Garcia', 'liam@example.com', '+1234567903', 2, 399.00, 'active'],
          ['Mia Rodriguez', 'mia@example.com', '+1234567904', 4, 759.96, 'active'],
        ];

        const customerOps = customers.map(customer => (callback) => {
          db.run(
            'INSERT INTO customers (name, email, phone, total_orders, total_spent, status) VALUES (?, ?, ?, ?, ?, ?)',
            customer,
            callback
          );
        });

         // Seed Products - 15 entries (some with low stock to trigger alerts)
         const products = [
           ['SKU-001', 'Wireless Headphones', 'Premium wireless headphones with noise cancellation', 'Electronics', 199.99, 120.00, 45, 10],
           ['SKU-002', 'Smart Watch', 'Feature-rich smartwatch with health tracking', 'Electronics', 299.99, 180.00, 5, 10], // LOW STOCK
           ['SKU-003', 'Laptop Stand', 'Ergonomic aluminum laptop stand', 'Accessories', 49.99, 25.00, 100, 20],
           ['SKU-004', 'USB-C Cable', 'High-speed USB-C charging cable', 'Accessories', 19.99, 8.00, 200, 50],
           ['SKU-005', 'Wireless Mouse', 'Ergonomic wireless mouse', 'Accessories', 29.99, 15.00, 8, 30], // LOW STOCK
           ['SKU-006', 'Mechanical Keyboard', 'RGB backlit mechanical keyboard', 'Electronics', 129.99, 75.00, 12, 15], // LOW STOCK
           ['SKU-007', 'Webcam HD', '1080p HD webcam for video calls', 'Electronics', 79.99, 45.00, 80, 20],
           ['SKU-008', 'Monitor Stand', 'Adjustable dual monitor stand', 'Accessories', 89.99, 50.00, 3, 10], // LOW STOCK
           ['SKU-009', 'USB Hub', '7-port USB 3.0 hub', 'Accessories', 34.99, 18.00, 120, 30],
           ['SKU-010', 'Laptop Sleeve', 'Protective laptop sleeve', 'Accessories', 24.99, 12.00, 200, 50],
           ['SKU-011', 'Tablet Stand', 'Adjustable tablet stand', 'Accessories', 39.99, 20.00, 90, 25],
           ['SKU-012', 'Gaming Mouse', 'High-precision gaming mouse', 'Electronics', 69.99, 40.00, 7, 15], // LOW STOCK
           ['SKU-013', 'Bluetooth Speaker', 'Portable Bluetooth speaker', 'Electronics', 59.99, 35.00, 85, 20],
           ['SKU-014', 'Phone Case', 'Protective phone case', 'Accessories', 19.99, 8.00, 300, 75],
           ['SKU-015', 'Screen Protector', 'Tempered glass screen protector', 'Accessories', 14.99, 5.00, 2, 60], // LOW STOCK
         ];

        const productOps = products.map(product => (callback) => {
          db.run(
            'INSERT INTO products (sku, name, description, category, price, cost, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            product,
            callback
          );
        });

        // Seed Campaigns - 12 entries
        const campaigns = [
          ['Summer Sale 2024', 'email', 'active', 5000, 3200, 50000, 2500, 150, '2024-06-01', '2024-08-31'],
          ['Black Friday', 'social', 'active', 10000, 7500, 120000, 8000, 400, '2024-11-20', '2024-11-30'],
          ['New Product Launch', 'display', 'draft', 3000, 0, 0, 0, 0, '2024-12-01', '2024-12-31'],
          ['Holiday Campaign', 'email', 'active', 8000, 5200, 80000, 5000, 250, '2024-12-01', '2024-12-31'],
          ['Spring Collection', 'social', 'active', 6000, 3800, 60000, 3500, 180, '2024-03-01', '2024-05-31'],
          ['Back to School', 'display', 'active', 4500, 2900, 45000, 2800, 140, '2024-08-01', '2024-09-30'],
          ['Flash Sale', 'email', 'active', 2000, 1500, 20000, 1200, 60, '2024-01-15', '2024-01-20'],
          ['Valentine Special', 'social', 'completed', 3500, 3500, 40000, 2500, 120, '2024-02-01', '2024-02-14'],
          ['Tech Week', 'display', 'active', 7000, 4500, 70000, 4200, 210, '2024-04-01', '2024-04-07'],
          ['Clearance Sale', 'email', 'active', 3000, 2000, 30000, 1800, 90, '2024-01-01', '2024-12-31'],
          ['Influencer Campaign', 'social', 'active', 5500, 3600, 55000, 3300, 165, '2024-05-01', '2024-05-31'],
          ['Customer Retention', 'email', 'active', 4000, 2600, 40000, 2400, 120, '2024-01-01', '2024-12-31'],
        ];

        const campaignOps = campaigns.map(campaign => (callback) => {
          db.run(
            'INSERT INTO campaigns (name, type, status, budget, spent, impressions, clicks, conversions, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            campaign,
            callback
          );
        });

        // Seed Promotions - 12 entries
        const promotions = [
          ['Welcome Discount', 'WELCOME10', 'percentage', 10, 0, 50, 100, 25, 'active', '2024-01-01', '2024-12-31'],
          ['Free Shipping', 'FREESHIP', 'fixed', 0, 0, 0, null, 500, 'active', '2024-01-01', '2024-12-31'],
          ['Holiday Special', 'HOLIDAY20', 'percentage', 20, 0, 100, 200, 50, 'active', '2024-12-01', '2024-12-31'],
          ['Student Discount', 'STUDENT15', 'percentage', 15, 0, 0, null, 150, 'active', '2024-01-01', '2024-12-31'],
          ['First Order', 'FIRST25', 'percentage', 25, 50, 100, 200, 45, 'active', '2024-01-01', '2024-12-31'],
          ['Bulk Purchase', 'BULK30', 'percentage', 30, 200, 300, 100, 20, 'active', '2024-01-01', '2024-12-31'],
          ['Flash Sale', 'FLASH50', 'percentage', 50, 100, 500, 50, 15, 'active', '2024-01-15', '2024-01-20'],
          ['Referral Bonus', 'REFER20', 'percentage', 20, 0, 50, null, 80, 'active', '2024-01-01', '2024-12-31'],
          ['Loyalty Reward', 'LOYAL15', 'percentage', 15, 0, 0, null, 120, 'active', '2024-01-01', '2024-12-31'],
          ['New Customer', 'NEW30', 'percentage', 30, 0, 150, 100, 35, 'active', '2024-01-01', '2024-12-31'],
          ['Weekend Special', 'WEEKEND10', 'percentage', 10, 0, 0, null, 200, 'active', '2024-01-01', '2024-12-31'],
          ['Clearance', 'CLEAR40', 'percentage', 40, 50, 200, 75, 10, 'active', '2024-01-01', '2024-12-31'],
        ];

        const promotionOps = promotions.map(promo => (callback) => {
          db.run(
            'INSERT INTO promotions (name, code, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            promo,
            callback
          );
        });

        // Seed Shipments (after orders are created) - 12 entries
        const shipmentOps = [
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK001', 'FedEx', 'delivered', '123 Warehouse St, New York, NY', '456 Main St, New York, NY', '2024-01-15', 15.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (4, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK002', 'UPS', 'in_transit', '123 Warehouse St, New York, NY', '789 Oak Ave, Los Angeles, CA', '2024-01-20', 12.50],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (6, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK003', 'DHL', 'delivered', '123 Warehouse St, New York, NY', '321 Pine St, Chicago, IL', '2024-01-18', 18.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (7, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK004', 'FedEx', 'in_transit', '123 Warehouse St, New York, NY', '654 Elm St, Houston, TX', '2024-01-22', 14.50],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (8, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK005', 'USPS', 'pending', '123 Warehouse St, New York, NY', '987 Maple Ave, Phoenix, AZ', '2024-01-25', 10.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (10, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK006', 'UPS', 'delivered', '123 Warehouse St, New York, NY', '147 Cedar Blvd, Philadelphia, PA', '2024-01-16', 13.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (11, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK007', 'FedEx', 'in_transit', '123 Warehouse St, New York, NY', '258 Birch Dr, San Antonio, TX', '2024-01-23', 16.50],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (12, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK008', 'DHL', 'delivered', '123 Warehouse St, New York, NY', '369 Willow Ln, San Diego, CA', '2024-01-17', 19.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (13, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK009', 'USPS', 'pending', '123 Warehouse St, New York, NY', '741 Spruce St, Dallas, TX', '2024-01-26', 11.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (15, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK010', 'UPS', 'in_transit', '123 Warehouse St, New York, NY', '852 Poplar Ave, San Jose, CA', '2024-01-24', 15.50],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (2, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK011', 'FedEx', 'delivered', '123 Warehouse St, New York, NY', '963 Ash Rd, Austin, TX', '2024-01-19', 17.99],
            callback
          ),
          (callback) => db.run(
            'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (5, ?, ?, ?, ?, ?, ?, ?)',
            ['TRACK012', 'DHL', 'in_transit', '123 Warehouse St, New York, NY', '159 Cherry Way, Jacksonville, FL', '2024-01-21', 14.99],
            callback
          ),
        ];

        // Seed Warehouses - 10 entries
        const warehouses = [
          ['Main Warehouse', 'New York, NY', 10000, 7500, 'active'],
          ['West Coast Hub', 'Los Angeles, CA', 8000, 5200, 'active'],
          ['East Coast Hub', 'Boston, MA', 6000, 3800, 'active'],
          ['Central Distribution', 'Chicago, IL', 9000, 6800, 'active'],
          ['Southern Hub', 'Atlanta, GA', 7500, 5600, 'active'],
          ['Pacific Northwest', 'Seattle, WA', 7000, 4800, 'active'],
          ['Texas Distribution', 'Dallas, TX', 8500, 6200, 'active'],
          ['Midwest Center', 'Detroit, MI', 6500, 4500, 'active'],
          ['Southwest Hub', 'Phoenix, AZ', 7200, 5100, 'active'],
          ['Northeast Facility', 'Philadelphia, PA', 6800, 4900, 'active'],
        ];

        const warehouseOps = warehouses.map(warehouse => (callback) => {
          db.run(
            'INSERT INTO warehouses (name, location, capacity, current_stock, status) VALUES (?, ?, ?, ?, ?)',
            warehouse,
            callback
          );
        });

        // Seed Stock Movements - 15 entries
        const stockMovementOps = [
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (1, ?, ?, ?, ?)', ['in', 50, 'Initial stock', 'PO-001'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (2, ?, ?, ?, ?)', ['in', 40, 'Restock', 'PO-002'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (3, ?, ?, ?, ?)', ['out', 5, 'Sale', 'ORD-001'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (4, ?, ?, ?, ?)', ['in', 100, 'Bulk purchase', 'PO-003'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (5, ?, ?, ?, ?)', ['out', 10, 'Sale', 'ORD-002'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (6, ?, ?, ?, ?)', ['in', 30, 'New product', 'PO-004'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (7, ?, ?, ?, ?)', ['out', 3, 'Sale', 'ORD-003'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (8, ?, ?, ?, ?)', ['in', 25, 'Restock', 'PO-005'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (9, ?, ?, ?, ?)', ['out', 8, 'Sale', 'ORD-004'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (10, ?, ?, ?, ?)', ['in', 150, 'Bulk purchase', 'PO-006'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (11, ?, ?, ?, ?)', ['out', 12, 'Sale', 'ORD-005'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (12, ?, ?, ?, ?)', ['in', 35, 'Restock', 'PO-007'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (13, ?, ?, ?, ?)', ['out', 7, 'Sale', 'ORD-006'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (14, ?, ?, ?, ?)', ['in', 200, 'Bulk purchase', 'PO-008'], callback),
          (callback) => db.run('INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (15, ?, ?, ?, ?)', ['out', 15, 'Sale', 'ORD-007'], callback),
        ];

        // Seed Users - 12 entries
        const users = [
          ['admin', 'admin@example.com', 'hashed_password_123', 'Admin User', 'admin', 'active'],
          ['john_manager', 'john.manager@example.com', 'hashed_password_123', 'John Manager', 'manager', 'active'],
          ['jane_ops', 'jane.ops@example.com', 'hashed_password_123', 'Jane Operations', 'operations', 'active'],
          ['bob_marketing', 'bob.marketing@example.com', 'hashed_password_123', 'Bob Marketing', 'marketing', 'active'],
          ['alice_inventory', 'alice.inventory@example.com', 'hashed_password_123', 'Alice Inventory', 'inventory', 'active'],
          ['charlie_logistics', 'charlie.logistics@example.com', 'hashed_password_123', 'Charlie Logistics', 'logistics', 'active'],
          ['david_support', 'david.support@example.com', 'hashed_password_123', 'David Support', 'support', 'active'],
          ['emma_analyst', 'emma.analyst@example.com', 'hashed_password_123', 'Emma Analyst', 'analyst', 'active'],
          ['frank_supervisor', 'frank.supervisor@example.com', 'hashed_password_123', 'Frank Supervisor', 'supervisor', 'active'],
          ['grace_coordinator', 'grace.coordinator@example.com', 'hashed_password_123', 'Grace Coordinator', 'coordinator', 'active'],
          ['henry_viewer', 'henry.viewer@example.com', 'hashed_password_123', 'Henry Viewer', 'viewer', 'active'],
          ['ivy_admin', 'ivy.admin@example.com', 'hashed_password_123', 'Ivy Admin', 'admin', 'active'],
        ];

         const userOps = users.map((user, index) => (callback) => {
           // #region agent log
           logDebug('server/database.js:505', 'Inserting user', {index,username:user[0]}, 'A');
           // #endregion
           db.run(
             'INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
             user,
             function(err) {
               // #region agent log
               logDebug('server/database.js:510', 'User insert result', {index,username:user[0],error:err?.message,lastID:this.lastID}, 'A');
               // #endregion
               callback(err);
             }
           );
         });

        // Create default preferences for all users (after users are created)
        const preferenceOps = users.map((user, index) => (callback) => {
          // User IDs will be sequential starting from 1
          const userId = index + 1;
          const preferences = [
            userId,
            'light',
            'en',
            'UTC',
            'MM/DD/YYYY',
            '12h',
            1,
            1,
            'default',
            25,
            'table',
            null,
            null
          ];
          db.run(
            'INSERT INTO user_preferences (user_id, theme, language, timezone, date_format, time_format, notifications_enabled, email_notifications, dashboard_layout, items_per_page, default_view, favorite_modules, custom_settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            preferences,
            callback
          );
        });

         // Seed Daily Stats
         const today = new Date().toISOString().split('T')[0];
         const statsOp = (callback) => {
           db.run(
             'INSERT INTO daily_stats (date, revenue, orders_count, customers_count, products_sold) VALUES (?, ?, ?, ?, ?)',
             [today, 1250.50, 12, 8, 25],
             callback
           );
         };

         // Seed User Activity History
         const activityHistory = [
           [1, 'login', 'User logged into the system', 'auth', null, null, '192.168.1.100', 'Mozilla/5.0', JSON.stringify({ method: 'web' })],
           [1, 'view', 'Viewed dashboard overview', 'dashboard', null, null, '192.168.1.100', 'Mozilla/5.0', JSON.stringify({ page: 'overview' })],
           [1, 'edit', 'Updated order ORD-001 status', 'operations', 'order', 1, '192.168.1.100', 'Mozilla/5.0', JSON.stringify({ status: 'completed' })],
           [2, 'login', 'User logged into the system', 'auth', null, null, '192.168.1.101', 'Mozilla/5.0', JSON.stringify({ method: 'web' })],
           [2, 'view', 'Viewed operations orders', 'operations', 'order', null, '192.168.1.101', 'Mozilla/5.0', JSON.stringify({ page: 'orders' })],
           [3, 'login', 'User logged into the system', 'auth', null, null, '192.168.1.102', 'Mozilla/5.0', JSON.stringify({ method: 'web' })],
           [3, 'view', 'Viewed marketing campaigns', 'marketing', 'campaign', null, '192.168.1.102', 'Mozilla/5.0', JSON.stringify({ page: 'campaigns' })],
           [3, 'create', 'Created new campaign', 'marketing', 'campaign', 1, '192.168.1.102', 'Mozilla/5.0', JSON.stringify({ name: 'Summer Sale' })],
           [4, 'login', 'User logged into the system', 'auth', null, null, '192.168.1.103', 'Mozilla/5.0', JSON.stringify({ method: 'web' })],
           [4, 'view', 'Viewed inventory products', 'inventory', 'product', null, '192.168.1.103', 'Mozilla/5.0', JSON.stringify({ page: 'products' })],
           [4, 'edit', 'Updated product stock', 'inventory', 'product', 1, '192.168.1.103', 'Mozilla/5.0', JSON.stringify({ stock: 50 })],
           [5, 'login', 'User logged into the system', 'auth', null, null, '192.168.1.104', 'Mozilla/5.0', JSON.stringify({ method: 'web' })],
           [5, 'view', 'Viewed logistics shipments', 'logistics', 'shipment', null, '192.168.1.104', 'Mozilla/5.0', JSON.stringify({ page: 'shipments' })],
           [5, 'update', 'Updated shipment status', 'logistics', 'shipment', 1, '192.168.1.104', 'Mozilla/5.0', JSON.stringify({ status: 'in_transit' })],
           [1, 'view', 'Viewed analytics overview', 'analytics', null, null, '192.168.1.100', 'Mozilla/5.0', JSON.stringify({ page: 'overview' })],
           [1, 'export', 'Exported orders report', 'operations', 'order', null, '192.168.1.100', 'Mozilla/5.0', JSON.stringify({ format: 'csv' })],
           [2, 'search', 'Searched for customer', 'operations', 'customer', null, '192.168.1.101', 'Mozilla/5.0', JSON.stringify({ query: 'John Doe' })],
           [3, 'view', 'Viewed promotion details', 'marketing', 'promotion', 1, '192.168.1.102', 'Mozilla/5.0', JSON.stringify({ id: 1 })],
           [4, 'create', 'Created stock movement', 'inventory', 'stock_movement', 1, '192.168.1.103', 'Mozilla/5.0', JSON.stringify({ type: 'in', quantity: 100 })],
           [5, 'view', 'Viewed warehouse details', 'logistics', 'warehouse', 1, '192.168.1.104', 'Mozilla/5.0', JSON.stringify({ id: 1 })],
         ];

         const activityOps = activityHistory.map(activity => (callback) => {
           db.run(
             'INSERT INTO user_activity_history (user_id, action_type, action_description, module, entity_type, entity_id, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
             activity,
             callback
           );
         });

         // Run all operations sequentially
         const allOps = [
           ...orderOps,
           ...customerOps,
           ...productOps,
           ...campaignOps,
           ...promotionOps,
           ...shipmentOps,
           ...warehouseOps,
           ...stockMovementOps,
           ...userOps,
           ...preferenceOps,
           statsOp,
           ...activityOps,
         ];

         runSequentially(allOps, (err) => {
           // #region agent log
           logDebug('server/database.js:570', 'Seeding operations completed', {error:err?.message}, 'A');
           // #endregion
           if (err) {
             reject(err);
             return;
           }
           console.log('Database seeded successfully');
           // #region agent log
           db.get('SELECT COUNT(*) as count FROM users', [], (verifyErr, verifyRow) => {
             logDebug('server/database.js:576', 'Verifying users after seed', {error:verifyErr?.message,userCount:verifyRow?.count}, 'A');
           });
           // #endregion
           resolve();
         });
       } else {
         // #region agent log
         db.get('SELECT COUNT(*) as count FROM users', [], (checkErr, checkRow) => {
           logDebug('server/database.js:584', 'Skipping seed - checking existing users', {error:checkErr?.message,userCount:checkRow?.count,orderCount:row.count}, 'E');
         });
         // #endregion
         resolve();
       }
     });
   });
 };

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = {
  init,
  getDb
};


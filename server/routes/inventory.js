const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all products
router.get('/products', (req, res) => {
  const db = getDb();
  const { category, status, low_stock } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (low_stock === 'true') {
    conditions.push('stock_quantity <= low_stock_threshold');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get inventory statistics (must be before /products/:id)
router.get('/products/stats', (req, res) => {
  const db = getDb();
  db.all(`
    SELECT 
      category,
      COUNT(*) as total_products,
      SUM(stock_quantity) as total_stock,
      SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count
    FROM products
    GROUP BY category
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get product by ID
router.get('/products/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Create new product
router.post('/products', (req, res) => {
  const db = getDb();
  const { sku, name, description, category, price, cost, stock_quantity, low_stock_threshold, status } = req.body;
  
  db.run(
    'INSERT INTO products (sku, name, description, category, price, cost, stock_quantity, low_stock_threshold, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [sku, name, description, category, price, cost, stock_quantity || 0, low_stock_threshold || 10, status || 'active'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Product created successfully' });
    }
  );
});

// Update product
router.put('/products/:id', (req, res) => {
  const db = getDb();
  const { name, description, price, cost, stock_quantity, low_stock_threshold, status } = req.body;
  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (description) {
    updates.push('description = ?');
    params.push(description);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    params.push(price);
  }
  if (cost !== undefined) {
    updates.push('cost = ?');
    params.push(cost);
  }
  if (stock_quantity !== undefined) {
    updates.push('stock_quantity = ?');
    params.push(stock_quantity);
  }
  if (low_stock_threshold !== undefined) {
    updates.push('low_stock_threshold = ?');
    params.push(low_stock_threshold);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.run(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Product updated successfully', changes: this.changes });
    }
  );
});

// Get stock movements
router.get('/stock-movements', (req, res) => {
  const db = getDb();
  const { product_id, limit = 100 } = req.query;
  let query = `
    SELECT sm.*, p.name as product_name, p.sku
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
  `;
  const params = [];

  if (product_id) {
    query += ' WHERE sm.product_id = ?';
    params.push(product_id);
  }

  query += ' ORDER BY sm.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create stock movement
router.post('/stock-movements', (req, res) => {
  const db = getDb();
  const { product_id, type, quantity, reason, reference } = req.body;
  
  db.run(
    'INSERT INTO stock_movements (product_id, type, quantity, reason, reference) VALUES (?, ?, ?, ?, ?)',
    [product_id, type, quantity, reason, reference],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const movementId = this.lastID;
      
      // Update product stock
      const stockChange = type === 'in' ? quantity : -quantity;
      db.run(
        'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [stockChange, product_id],
        (updateErr) => {
          if (updateErr) {
            res.status(500).json({ error: updateErr.message });
            return;
          }
          res.json({ id: movementId, message: 'Stock movement recorded successfully' });
        }
      );
    }
  );
});

module.exports = router;


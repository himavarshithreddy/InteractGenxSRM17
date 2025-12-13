const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get dashboard overview
router.get('/overview', (req, res) => {
  const db = getDb();
  const overview = {};

  // Total revenue
  db.get('SELECT SUM(total_amount) as total FROM orders WHERE payment_status = "paid"', [], (err, revenueRow) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    overview.totalRevenue = revenueRow.total || 0;

    // Total orders
    db.get('SELECT COUNT(*) as total FROM orders', [], (err, ordersRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      overview.totalOrders = ordersRow.total || 0;

      // Total customers
      db.get('SELECT COUNT(*) as total FROM customers', [], (err, customersRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        overview.totalCustomers = customersRow.total || 0;

        // Total products
        db.get('SELECT COUNT(*) as total FROM products', [], (err, productsRow) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          overview.totalProducts = productsRow.total || 0;

          // Pending orders
          db.get('SELECT COUNT(*) as total FROM orders WHERE status = "pending"', [], (err, pendingRow) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            overview.pendingOrders = pendingRow.total || 0;

            // Low stock products
            db.get('SELECT COUNT(*) as total FROM products WHERE stock_quantity <= low_stock_threshold', [], (err, lowStockRow) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              overview.lowStockProducts = lowStockRow.total || 0;

              // Active campaigns
              db.get('SELECT COUNT(*) as total FROM campaigns WHERE status = "active"', [], (err, campaignsRow) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                overview.activeCampaigns = campaignsRow.total || 0;

                res.json(overview);
              });
            });
          });
        });
      });
    });
  });
});

// Get revenue trends
router.get('/revenue-trends', (req, res) => {
  const db = getDb();
  const { days = 30 } = req.query;
  
  db.all(`
    SELECT 
      DATE(created_at) as date,
      SUM(total_amount) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE payment_status = 'paid' 
      AND created_at >= date('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [days], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get top products
router.get('/top-products', (req, res) => {
  const db = getDb();
  const { limit = 10 } = req.query;
  
  db.all(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.price,
      p.stock_quantity,
      COUNT(sm.id) as movements
    FROM products p
    LEFT JOIN stock_movements sm ON p.id = sm.product_id AND sm.type = 'out'
    GROUP BY p.id
    ORDER BY movements DESC
    LIMIT ?
  `, [limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all orders
router.get('/orders', (req, res) => {
  const db = getDb();
  const { status, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get order statistics (must be before /orders/:id)
router.get('/orders/stats', (req, res) => {
  const db = getDb();
  db.all(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total_amount) as total_revenue
    FROM orders
    GROUP BY status
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get order by ID
router.get('/orders/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(row);
  });
});

// Create new order
router.post('/orders', (req, res) => {
  const db = getDb();
  const { order_number, customer_name, customer_email, total_amount, status, payment_status } = req.body;
  
  db.run(
    'INSERT INTO orders (order_number, customer_name, customer_email, total_amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
    [order_number, customer_name, customer_email, total_amount, status || 'pending', payment_status || 'unpaid'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Order created successfully' });
    }
  );
});

// Update order
router.put('/orders/:id', (req, res) => {
  const db = getDb();
  const { status, payment_status, total_amount } = req.body;
  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (payment_status) {
    updates.push('payment_status = ?');
    params.push(payment_status);
  }
  if (total_amount) {
    updates.push('total_amount = ?');
    params.push(total_amount);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.run(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Order updated successfully', changes: this.changes });
    }
  );
});

// Get all customers
router.get('/customers', (req, res) => {
  const db = getDb();
  const { status, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM customers';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get customer by ID
router.get('/customers/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(row);
  });
});

// Update customer
router.put('/customers/:id', (req, res) => {
  const db = getDb();
  const { name, email, phone, total_orders, total_spent, status } = req.body;
  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (total_orders !== undefined) {
    updates.push('total_orders = ?');
    params.push(total_orders);
  }
  if (total_spent !== undefined) {
    updates.push('total_spent = ?');
    params.push(total_spent);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  params.push(req.params.id);

  db.run(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Customer updated successfully', changes: this.changes });
    }
  );
});

module.exports = router;


const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all shipments
router.get('/shipments', (req, res) => {
  const db = getDb();
  const { status, order_id } = req.query;
  let query = `
    SELECT s.*, o.order_number, o.customer_name, o.customer_email
    FROM shipments s
    JOIN orders o ON s.order_id = o.id
  `;
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }
  if (order_id) {
    conditions.push('s.order_id = ?');
    params.push(order_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get shipment statistics (must be before /shipments/:id)
router.get('/shipments/stats', (req, res) => {
  const db = getDb();
  db.all(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(shipping_cost) as total_cost
    FROM shipments
    GROUP BY status
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get shipment by ID
router.get('/shipments/:id', (req, res) => {
  const db = getDb();
  db.get(`
    SELECT s.*, o.order_number, o.customer_name, o.customer_email
    FROM shipments s
    JOIN orders o ON s.order_id = o.id
    WHERE s.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    res.json(row);
  });
});

// Create new shipment
router.post('/shipments', (req, res) => {
  const db = getDb();
  const { order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost } = req.body;
  
  db.run(
    'INSERT INTO shipments (order_id, tracking_number, carrier, status, origin_address, destination_address, estimated_delivery, shipping_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [order_id, tracking_number, carrier, status || 'pending', origin_address, destination_address, estimated_delivery, shipping_cost || 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Shipment created successfully' });
    }
  );
});

// Update shipment
router.put('/shipments/:id', (req, res) => {
  const db = getDb();
  const { status, tracking_number, estimated_delivery, actual_delivery } = req.body;
  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (tracking_number) {
    updates.push('tracking_number = ?');
    params.push(tracking_number);
  }
  if (estimated_delivery) {
    updates.push('estimated_delivery = ?');
    params.push(estimated_delivery);
  }
  if (actual_delivery) {
    updates.push('actual_delivery = ?');
    params.push(actual_delivery);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.run(
    `UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Shipment updated successfully', changes: this.changes });
    }
  );
});

// Get all warehouses
router.get('/warehouses', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM warehouses ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get warehouse by ID
router.get('/warehouses/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM warehouses WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }
    res.json(row);
  });
});

// Create new warehouse
router.post('/warehouses', (req, res) => {
  const db = getDb();
  const { name, location, capacity, status } = req.body;
  
  db.run(
    'INSERT INTO warehouses (name, location, capacity, status) VALUES (?, ?, ?, ?)',
    [name, location, capacity, status || 'active'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Warehouse created successfully' });
    }
  );
});

// Update warehouse
router.put('/warehouses/:id', (req, res) => {
  const db = getDb();
  const { name, location, capacity, current_stock, status } = req.body;
  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (location) {
    updates.push('location = ?');
    params.push(location);
  }
  if (capacity !== undefined) {
    updates.push('capacity = ?');
    params.push(capacity);
  }
  if (current_stock !== undefined) {
    updates.push('current_stock = ?');
    params.push(current_stock);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  params.push(req.params.id);

  db.run(
    `UPDATE warehouses SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Warehouse updated successfully', changes: this.changes });
    }
  );
});

module.exports = router;


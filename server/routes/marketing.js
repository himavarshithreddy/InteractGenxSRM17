const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all campaigns
router.get('/campaigns', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let query = 'SELECT * FROM campaigns';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
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

// Get campaign by ID
router.get('/campaigns/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM campaigns WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(row);
  });
});

// Create new campaign
router.post('/campaigns', (req, res) => {
  const db = getDb();
  const { name, type, status, budget, start_date, end_date } = req.body;
  
  db.run(
    'INSERT INTO campaigns (name, type, status, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
    [name, type, status || 'draft', budget || 0, start_date, end_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Campaign created successfully' });
    }
  );
});

// Update campaign
router.put('/campaigns/:id', (req, res) => {
  const db = getDb();
  const { name, status, budget, spent, impressions, clicks, conversions } = req.body;
  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (budget !== undefined) {
    updates.push('budget = ?');
    params.push(budget);
  }
  if (spent !== undefined) {
    updates.push('spent = ?');
    params.push(spent);
  }
  if (impressions !== undefined) {
    updates.push('impressions = ?');
    params.push(impressions);
  }
  if (clicks !== undefined) {
    updates.push('clicks = ?');
    params.push(clicks);
  }
  if (conversions !== undefined) {
    updates.push('conversions = ?');
    params.push(conversions);
  }

  params.push(req.params.id);

  db.run(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Campaign updated successfully', changes: this.changes });
    }
  );
});

// Get all promotions
router.get('/promotions', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  let query = 'SELECT * FROM promotions';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
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

// Get promotion by ID
router.get('/promotions/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT * FROM promotions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }
    res.json(row);
  });
});

// Create new promotion
router.post('/promotions', (req, res) => {
  const db = getDb();
  const { name, code, discount_type, discount_value, min_purchase, max_discount, usage_limit, status, start_date, end_date } = req.body;
  
  db.run(
    'INSERT INTO promotions (name, code, discount_type, discount_value, min_purchase, max_discount, usage_limit, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, code, discount_type, discount_value, min_purchase || 0, max_discount, usage_limit, status || 'active', start_date, end_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Promotion created successfully' });
    }
  );
});

// Update promotion
router.put('/promotions/:id', (req, res) => {
  const db = getDb();
  const { name, status, used_count } = req.body;
  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (used_count !== undefined) {
    updates.push('used_count = ?');
    params.push(used_count);
  }

  params.push(req.params.id);

  db.run(
    `UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Promotion updated successfully', changes: this.changes });
    }
  );
});

module.exports = router;


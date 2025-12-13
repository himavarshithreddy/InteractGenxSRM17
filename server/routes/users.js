const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const fs = require('fs');
const path = require('path');

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

// Get all users
router.get('/', (req, res) => {
  // #region agent log
  logDebug('server/routes/users.js:20', 'GET /users route called', {query:req.query}, 'B');
  // #endregion
  const db = getDb();
  const { status, role, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT id, username, email, full_name, role, status, last_login, created_at FROM users';
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // #region agent log
  logDebug('server/routes/users.js:42', 'Executing users query', {query,params}, 'B');
  // #endregion

  db.all(query, params, (err, rows) => {
    // #region agent log
    logDebug('server/routes/users.js:45', 'Users query result', {error:err?.message,rowCount:rows?.length,firstUser:rows?.[0]}, 'B');
    // #endregion
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // #region agent log
    logDebug('server/routes/users.js:51', 'Sending users response', {userCount:rows.length}, 'B');
    // #endregion
    res.json(rows);
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const db = getDb();
  db.get('SELECT id, username, email, full_name, role, status, last_login, created_at FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(row);
  });
});

// Create new user
router.post('/', (req, res) => {
  const db = getDb();
  const { username, email, password_hash, full_name, role, status } = req.body;
  
  db.run(
    'INSERT INTO users (username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, password_hash || 'hashed_password_123', full_name, role || 'admin', status || 'active'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'User created successfully' });
    }
  );
});

// Update user
router.put('/:id', (req, res) => {
  const db = getDb();
  const { username, email, full_name, role, status, password_hash } = req.body;
  const updates = [];
  const params = [];

  if (username) {
    updates.push('username = ?');
    params.push(username);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  if (full_name) {
    updates.push('full_name = ?');
    params.push(full_name);
  }
  if (role) {
    updates.push('role = ?');
    params.push(role);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (password_hash) {
    updates.push('password_hash = ?');
    params.push(password_hash);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'User updated successfully', changes: this.changes });
    }
  );
});

// Delete user
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User deleted successfully', changes: this.changes });
  });
});

module.exports = router;


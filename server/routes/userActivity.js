const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get user activity history
router.get('/:userId', (req, res) => {
  const db = getDb();
  const { limit = 50, offset = 0, action_type, module: moduleFilter, entity_type } = req.query;
  
  let query = 'SELECT * FROM user_activity_history WHERE user_id = ?';
  const params = [req.params.userId];
  const conditions = [];

  if (action_type) {
    conditions.push('action_type = ?');
    params.push(action_type);
  }
  if (moduleFilter) {
    conditions.push('module = ?');
    params.push(moduleFilter);
  }
  if (entity_type) {
    conditions.push('entity_type = ?');
    params.push(entity_type);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse JSON metadata
    const activities = rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
    res.json(activities);
  });
});

// Create new activity log entry
router.post('/:userId', (req, res) => {
  const db = getDb();
  const {
    action_type,
    action_description,
    module,
    entity_type,
    entity_id,
    ip_address,
    user_agent,
    metadata,
  } = req.body;

  db.run(
    'INSERT INTO user_activity_history (user_id, action_type, action_description, module, entity_type, entity_id, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      req.params.userId,
      action_type,
      action_description,
      module || null,
      entity_type || null,
      entity_id || null,
      ip_address || null,
      user_agent || null,
      metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : null,
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Activity logged successfully' });
    }
  );
});

// Get activity statistics for a user
router.get('/:userId/stats', (req, res) => {
  const db = getDb();
  const { days = 30 } = req.query;
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - parseInt(days));

  // Get activity count by type
  db.all(
    `SELECT action_type, COUNT(*) as count 
     FROM user_activity_history 
     WHERE user_id = ? AND created_at >= ? 
     GROUP BY action_type 
     ORDER BY count DESC`,
    [req.params.userId, dateLimit.toISOString()],
    (err, actionStats) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get activity count by module
      db.all(
        `SELECT module, COUNT(*) as count 
         FROM user_activity_history 
         WHERE user_id = ? AND created_at >= ? AND module IS NOT NULL
         GROUP BY module 
         ORDER BY count DESC`,
        [req.params.userId, dateLimit.toISOString()],
        (err, moduleStats) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Get total activities
          db.get(
            `SELECT COUNT(*) as total 
             FROM user_activity_history 
             WHERE user_id = ? AND created_at >= ?`,
            [req.params.userId, dateLimit.toISOString()],
            (err, totalRow) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              res.json({
                total: totalRow.total,
                by_action_type: actionStats,
                by_module: moduleStats,
                period_days: parseInt(days),
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;







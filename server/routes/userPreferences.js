const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get user preferences
router.get('/:userId', (req, res) => {
  const db = getDb();
  db.get(
    'SELECT * FROM user_preferences WHERE user_id = ?',
    [req.params.userId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: req.params.userId,
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          notifications_enabled: 1,
          email_notifications: 1,
          dashboard_layout: 'default',
          items_per_page: 25,
          default_view: 'table',
          favorite_modules: null,
          custom_settings: null,
        };
        db.run(
          'INSERT INTO user_preferences (user_id, theme, language, timezone, date_format, time_format, notifications_enabled, email_notifications, dashboard_layout, items_per_page, default_view, favorite_modules, custom_settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            defaultPrefs.user_id,
            defaultPrefs.theme,
            defaultPrefs.language,
            defaultPrefs.timezone,
            defaultPrefs.date_format,
            defaultPrefs.time_format,
            defaultPrefs.notifications_enabled,
            defaultPrefs.email_notifications,
            defaultPrefs.dashboard_layout,
            defaultPrefs.items_per_page,
            defaultPrefs.default_view,
            defaultPrefs.favorite_modules,
            defaultPrefs.custom_settings,
          ],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ ...defaultPrefs, id: this.lastID });
          }
        );
        return;
      }
      res.json(row);
    }
  );
});

// Update user preferences
router.put('/:userId', (req, res) => {
  const db = getDb();
  const {
    theme,
    language,
    timezone,
    date_format,
    time_format,
    notifications_enabled,
    email_notifications,
    dashboard_layout,
    items_per_page,
    default_view,
    favorite_modules,
    custom_settings,
  } = req.body;

  const updates = [];
  const params = [];

  if (theme !== undefined) {
    updates.push('theme = ?');
    params.push(theme);
  }
  if (language !== undefined) {
    updates.push('language = ?');
    params.push(language);
  }
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }
  if (date_format !== undefined) {
    updates.push('date_format = ?');
    params.push(date_format);
  }
  if (time_format !== undefined) {
    updates.push('time_format = ?');
    params.push(time_format);
  }
  if (notifications_enabled !== undefined) {
    updates.push('notifications_enabled = ?');
    params.push(notifications_enabled ? 1 : 0);
  }
  if (email_notifications !== undefined) {
    updates.push('email_notifications = ?');
    params.push(email_notifications ? 1 : 0);
  }
  if (dashboard_layout !== undefined) {
    updates.push('dashboard_layout = ?');
    params.push(dashboard_layout);
  }
  if (items_per_page !== undefined) {
    updates.push('items_per_page = ?');
    params.push(items_per_page);
  }
  if (default_view !== undefined) {
    updates.push('default_view = ?');
    params.push(default_view);
  }
  if (favorite_modules !== undefined) {
    updates.push('favorite_modules = ?');
    params.push(Array.isArray(favorite_modules) ? JSON.stringify(favorite_modules) : favorite_modules);
  }
  if (custom_settings !== undefined) {
    updates.push('custom_settings = ?');
    params.push(typeof custom_settings === 'object' ? JSON.stringify(custom_settings) : custom_settings);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.userId);

  db.run(
    `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        // Create preferences if they don't exist
        const defaultPrefs = {
          user_id: req.params.userId,
          theme: theme || 'light',
          language: language || 'en',
          timezone: timezone || 'UTC',
          date_format: date_format || 'MM/DD/YYYY',
          time_format: time_format || '12h',
          notifications_enabled: notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : 1,
          email_notifications: email_notifications !== undefined ? (email_notifications ? 1 : 0) : 1,
          dashboard_layout: dashboard_layout || 'default',
          items_per_page: items_per_page || 25,
          default_view: default_view || 'table',
          favorite_modules: favorite_modules ? (Array.isArray(favorite_modules) ? JSON.stringify(favorite_modules) : favorite_modules) : null,
          custom_settings: custom_settings ? (typeof custom_settings === 'object' ? JSON.stringify(custom_settings) : custom_settings) : null,
        };
        db.run(
          'INSERT INTO user_preferences (user_id, theme, language, timezone, date_format, time_format, notifications_enabled, email_notifications, dashboard_layout, items_per_page, default_view, favorite_modules, custom_settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            defaultPrefs.user_id,
            defaultPrefs.theme,
            defaultPrefs.language,
            defaultPrefs.timezone,
            defaultPrefs.date_format,
            defaultPrefs.time_format,
            defaultPrefs.notifications_enabled,
            defaultPrefs.email_notifications,
            defaultPrefs.dashboard_layout,
            defaultPrefs.items_per_page,
            defaultPrefs.default_view,
            defaultPrefs.favorite_modules,
            defaultPrefs.custom_settings,
          ],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ ...defaultPrefs, id: this.lastID });
          }
        );
        return;
      }
      res.json({ message: 'Preferences updated successfully', changes: this.changes });
    }
  );
});

module.exports = router;







const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

// Get notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    const result = await pool.query(
      'SELECT id, title, description, type, created_at, is_read FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.userId]
    );

    const notifications = result.rows.map(n => ({
      id: n.id,
      title: n.title,
      desc: n.description,
      type: n.type,
      is_read: n.is_read === 1,
      time: new Date(n.created_at).toLocaleDateString()
    }));

    res.json({ notifications });
  } catch (error) {
    console.error('Notifications Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.put('/read', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.userId]);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

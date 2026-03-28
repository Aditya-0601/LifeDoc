const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

// GET /api/reminders
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const manualRemindersQuery = await pool.query(`
      SELECT d.id, d.title as document_name, d.deadline_date as expiry_date, d.category as type, d.description as notes, 'manual' as source
      FROM deadlines d
      WHERE d.user_id = $1 AND d.is_completed = 0 AND d.deadline_date >= CURRENT_DATE
    `, [req.userId]);

    const autoRemindersQuery = await pool.query(`
      SELECT id, title as document_name, expiry_date, category as type, description as notes, 'auto' as source
      FROM documents
      WHERE user_id = $1 AND expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE
    `, [req.userId]);

    const allReminders = [...manualRemindersQuery.rows, ...autoRemindersQuery.rows];
    
    // Sort by expiry date ascending
    allReminders.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

    // Calculate days remaining and assign status badges
    const mapped = allReminders.map(r => {
      const diffTime = new Date(r.expiry_date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status = 'Safe';
      if (diffDays <= 7) status = 'Urgent';
      else if (diffDays <= 30) status = 'Approaching';

      return { ...r, days_remaining: diffDays, status_badge: status };
    });

    res.json({ reminders: mapped });
  } catch (error) {
    console.error('Fetch Reminders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reminders/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    // For history, fetch completed manual reminders and expired documents
    const completedManual = await pool.query(`
      SELECT id, title as document_name, deadline_date as expiry_date, 'Completed' as status_badge
      FROM deadlines
      WHERE user_id = $1 AND is_completed = 1
    `, [req.userId]);

    const expiredDocs = await pool.query(`
      SELECT id, title as document_name, expiry_date, 'Expired' as status_badge
      FROM documents
      WHERE user_id = $1 AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
    `, [req.userId]);

    const history = [...completedManual.rows, ...expiredDocs.rows];
    history.sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date));

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reminders
router.post('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { document_id, deadline_date, category, description, title } = req.body;
    
    // Title defaults to manual title if not bound to a document
    const finalTitle = title || 'Custom Reminder';

    const { rows } = await pool.query(`
      INSERT INTO deadlines (user_id, document_id, title, deadline_date, category, description)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.userId, document_id || null, finalTitle, deadline_date, category, description]);

    res.status(201).json({ message: 'Reminder created', reminder: rows[0] });
  } catch (error) {
    console.error('Create Reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/reminders/:id/dismiss (only for manual deadlines)
router.put('/:id/dismiss', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query(
      'UPDATE deadlines SET is_completed = 1 WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Reminder dismissed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

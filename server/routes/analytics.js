const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const userId = req.userId;

    // 1. Total Documents
    let totalDocuments = 0;
    let byCategory = [];
    try {
      const docsRes = await pool.query(
        'SELECT COUNT(*) as count FROM documents WHERE user_id = $1',
        [userId]
      );
      totalDocuments = parseInt(docsRes.rows[0].count) || 0;

      const catRes = await pool.query(
        'SELECT category, COUNT(*) as count FROM documents WHERE user_id = $1 GROUP BY category',
        [userId]
      );
      byCategory = catRes.rows.map(row => ({
        name: row.category || 'other',
        value: parseInt(row.count) || 0
      }));
    } catch (e) {
      console.error('Analytics: documents query failed:', e.message);
    }

    // 2. Expiring Soon from deadlines table
    let expiringSoonCount = 0;
    let expiringSoon = [];
    try {
      const expRes = await pool.query(
        `SELECT COUNT(*) as count
         FROM deadlines
         WHERE user_id = $1
           AND is_completed = 0
           AND deadline_date >= CURRENT_DATE
           AND deadline_date <= (CURRENT_DATE + INTERVAL '30 days')`,
        [userId]
      );
      expiringSoonCount = parseInt(expRes.rows[0].count) || 0;

      const expDetailedRes = await pool.query(
        `SELECT title as name,
                deadline_date,
                (deadline_date::date - CURRENT_DATE) as days_left
         FROM deadlines
         WHERE user_id = $1
           AND is_completed = 0
           AND deadline_date >= CURRENT_DATE
           AND deadline_date <= (CURRENT_DATE + INTERVAL '30 days')
         ORDER BY deadline_date ASC
         LIMIT 6`,
        [userId]
      );

      expiringSoon = expDetailedRes.rows.map(row => {
        const raw = row.name || 'Untitled';
        return {
          name: raw.length > 18 ? raw.substring(0, 18) + '…' : raw,
          daysLeft: parseInt(row.days_left) || 0,
          fullDate: row.deadline_date
        };
      });
    } catch (e) {
      console.error('Analytics: deadlines query failed:', e.message);
    }

    res.json({
      totalDocuments,
      byCategory,
      expiringSoonCount,
      expiringSoon
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: 'Server error retrieving analytics' });
  }
});

module.exports = router;


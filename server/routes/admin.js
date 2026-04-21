const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

router.post('/verify', authenticate, (req, res) => {
  const { code } = req.body;
  const adminSecret = process.env.ADMIN_SECRET || '123456';
  
  if (code === adminSecret) {
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Invalid admin code' });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query('SELECT id, email, name, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/disable', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('UPDATE users SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ message: 'User disabled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/enable', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('UPDATE users SET is_active = 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'User enabled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    // Deleting the user should cascade delete documents and deadlines because
    // of `ON DELETE CASCADE` in our init schema for `documents`, `deadlines`, etc.
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/documents', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(`
      SELECT d.*, u.email as user_email
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json({ documents: rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/documents/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    // We should log this as an admin deletion if we tracked admin actions, 
    // but the query is sufficient for normal functionality.
    const { rowCount } = await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Document not found' });
    
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const [users, docs, deadlines] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*), SUM(file_size) as total_size FROM documents'),
      pool.query('SELECT COUNT(*) FROM deadlines WHERE is_completed = 0 AND deadline_date >= CURRENT_DATE')
    ]);
    
    res.json({
      totalUsers: parseInt(users.rows[0].count) || 0,
      totalDocuments: parseInt(docs.rows[0].count) || 0,
      totalSize: parseInt(docs.rows[0].total_size) || 0,
      expiringDocuments: parseInt(deadlines.rows[0].count) || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

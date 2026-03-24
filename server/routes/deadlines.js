const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

// Smart prediction for document expiry
router.get('/predict', authenticate, (req, res) => {
  const { category } = req.query;
  
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  // Very basic prediction based on Indian rules
  const today = new Date();
  let defaultYears = 1;
  let defaultReminder = 30; // 30 days before

  switch (category.toLowerCase()) {
    case 'passport':
      defaultYears = 10;
      defaultReminder = 180; // 6 months before
      break;
    case 'driving license':
      defaultYears = 20;
      break;
    case 'insurance':
      defaultYears = 1;
      break;
    case 'fitness certificate':
      defaultYears = 1;
      break;
    case 'medication':
      defaultYears = 0;
      defaultReminder = 7; // 1 week before
      // 30 days default for general meds
      today.setDate(today.getDate() + 30);
      break;
    default:
      defaultYears = 1;
  }

  const suggestedDate = new Date(today.setFullYear(today.getFullYear() + defaultYears));
  
  res.json({
    suggested_date: suggestedDate.toISOString().split('T')[0],
    suggested_reminder_days: defaultReminder,
    category
  });
});

// Create deadline
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, deadline_date, reminder_days, category, document_id } = req.body;

    if (!title || !deadline_date) {
      return res.status(400).json({ error: 'Title and deadline date are required' });
    }

    const pool = getDb();
    const result = await pool.query(
      `INSERT INTO deadlines (user_id, document_id, title, description, deadline_date, reminder_days, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        req.userId,
        document_id || null,
        title,
        description || '',
        deadline_date,
        reminder_days || 30,
        category || 'other'
      ]
    );

    res.status(201).json({
      message: 'Deadline created successfully',
      deadline: {
        id: result.rows[0].id,
        title,
        deadline_date,
        reminder_days: reminder_days || 30,
        category: category || 'other'
      }
    });
  } catch (error) {
    console.error('Create Deadline Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all deadlines
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { upcoming, category } = req.query;

    let query = `
      SELECT d.*, doc.title as document_title, doc.file_path as document_path
      FROM deadlines d
      LEFT JOIN documents doc ON d.document_id = doc.id
      WHERE d.user_id = $1
    `;
    const params = [req.userId];

    if (upcoming === 'true') {
      // In Postgres, tracking dates is slightly different, CURRENT_DATE is standard
      query += ' AND d.deadline_date >= CURRENT_DATE AND d.is_completed = 0';
    }

    if (category) {
      params.push(category);
      query += ` AND d.category = $${params.length}`;
    }

    query += ' ORDER BY d.deadline_date ASC';

    const { rows } = await pool.query(query, params);
    res.json({ deadlines: rows });
  } catch (error) {
    console.error('Get Deadlines Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single deadline
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      `SELECT d.*, doc.title as document_title, doc.file_path as document_path
       FROM deadlines d
       LEFT JOIN documents doc ON d.document_id = doc.id
       WHERE d.id = $1 AND d.user_id = $2`,
      [req.params.id, req.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }
    
    res.json({ deadline: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update deadline
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, deadline_date, reminder_days, category, is_completed } = req.body;
    const pool = getDb();

    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${queryIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${queryIndex++}`);
      values.push(description);
    }
    if (deadline_date !== undefined) {
      updates.push(`deadline_date = $${queryIndex++}`);
      values.push(deadline_date);
    }
    if (reminder_days !== undefined) {
      updates.push(`reminder_days = $${queryIndex++}`);
      values.push(reminder_days);
    }
    if (category !== undefined) {
      updates.push(`category = $${queryIndex++}`);
      values.push(category);
    }
    if (is_completed !== undefined) {
      updates.push(`is_completed = $${queryIndex++}`);
      values.push(is_completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add id and user_id for WHERE clause
    values.push(req.params.id, req.userId);
    
    const query = `UPDATE deadlines SET ${updates.join(', ')} WHERE id = $${queryIndex++} AND user_id = $${queryIndex++}`;

    const { rowCount } = await pool.query(query, values);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }
    
    res.json({ message: 'Deadline updated successfully' });
  } catch (error) {
    console.error('Update Deadline Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete deadline
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query(
      'DELETE FROM deadlines WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Deadline not found' });
    }
    
    res.json({ message: 'Deadline deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

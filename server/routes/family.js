const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

// Add family member access
router.post('/request', authenticate, async (req, res) => {
  try {
    const { family_member_email, family_member_name } = req.body;

    if (!family_member_email || !family_member_name) {
      return res.status(400).json({ error: 'Family member email and name are required' });
    }

    const pool = getDb();
    
    // Ghost Invite Protection (Option A)
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [family_member_email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'This user is not registered' });
    }

    const access_code = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO family_access (user_id, family_member_email, family_member_name, access_code)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.userId, family_member_email, family_member_name, access_code]
    );

    // Get current user's name
    const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [req.userId]);
    const senderName = userRes.rows[0]?.name || 'Someone';

    // Notify the receiver if they have an active account
    const recRes = await pool.query('SELECT id FROM users WHERE email = $1', [family_member_email]);
    if (recRes.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, description, type)
         VALUES ($1, $2, $3, $4)`,
        [
          recRes.rows[0].id,
          'New Trusted Contact Invitation',
          `${senderName} invited you to be their emergency contact.`,
          'family'
        ]
      );
    }

    res.status(201).json({
      message: 'Family access created successfully',
      access: {
        id: rows[0].id,
        family_member_email,
        family_member_name,
        access_code,
        status: 'pending',
        is_active: true
      }
    });
  } catch (error) {
    console.error('Create Family Access Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all family access entries
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      'SELECT id, family_member_email, family_member_name, access_code, is_active, status, created_at FROM family_access WHERE user_id = $1',
      [req.userId]
    );
    res.json({ accesses: rows });
  } catch (error) {
    console.error('Fetch Family Access Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invitations sent TO the logged-in user
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      `SELECT f.id, f.status, f.created_at, u.name as sender_name, u.email as sender_email
       FROM family_access f
       JOIN users u ON f.user_id = u.id
       WHERE f.family_member_email = $1 AND f.status = 'pending'`,
      [req.userEmail]
    );
    res.json({ invitations: rows });
  } catch (error) {
    console.error('Fetch Invitations Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve family access
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query(
      "UPDATE family_access SET status = 'approved' WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    
    if (rowCount === 0) return res.status(404).json({ error: 'Family access not found' });
    res.json({ message: 'Family access approved' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject family access
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query(
      "UPDATE family_access SET status = 'rejected' WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    
    if (rowCount === 0) return res.status(404).json({ error: 'Family access not found' });
    res.json({ message: 'Family access rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete family access (Legacy access method if needed)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rowCount } = await pool.query(
      'DELETE FROM family_access WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Family access not found' });
    }
    
    res.json({ message: 'Family access deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Emergency access - get documents using access code
router.get('/emergency/:access_code', async (req, res) => {
  try {
    const pool = getDb();
    
    // First verify the access code
    const accessResult = await pool.query(
      'SELECT * FROM family_access WHERE access_code = $1 AND is_active = 1',
      [req.params.access_code]
    );
    
    const access = accessResult.rows[0];

    if (!access) {
      return res.status(401).json({ error: 'Invalid or inactive access code' });
    }

    // Get all documents for the user
    const { rows: documents } = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [access.user_id]
    );
    
    res.json({
      message: 'Emergency access granted',
      documents,
      owner_name: access.family_member_name
    });
  } catch (error) {
    console.error('Emergency Access Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------------------------------
// NEW: Receiver-based Accept/Reject
// ----------------------------------------------------

router.patch('/invitations/:id/accept', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    // Verify invitation belongs to to this receiver
    const { rows } = await pool.query(
      'SELECT user_id, family_member_name FROM family_access WHERE id = $1 AND family_member_email = $2', 
      [req.params.id, req.userEmail]
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'Invitation not found' });
    
    await pool.query("UPDATE family_access SET status = 'approved' WHERE id = $1", [req.params.id]);
    
    // Notify Sender
    const senderId = rows[0].user_id;
    await pool.query(
      `INSERT INTO notifications (user_id, title, description, type) VALUES ($1, $2, $3, $4)`,
      [senderId, 'Invitation Accepted', `${req.userEmail} has accepted your emergency access invitation.`, 'family']
    );

    res.json({ message: 'Invitation accepted' });
  } catch (error) {
    console.error('Accept Invitation Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/invitations/:id/reject', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    const { rows } = await pool.query(
      'SELECT user_id FROM family_access WHERE id = $1 AND family_member_email = $2', 
      [req.params.id, req.userEmail]
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'Invitation not found' });
    
    await pool.query("UPDATE family_access SET status = 'rejected' WHERE id = $1", [req.params.id]);
    
    // Optional: Notify sender of rejection
    const senderId = rows[0].user_id;
    await pool.query(
      `INSERT INTO notifications (user_id, title, description, type) VALUES ($1, $2, $3, $4)`,
      [senderId, 'Invitation Rejected', `${req.userEmail} has rejected your emergency access invitation.`, 'family']
    );
    
    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    console.error('Reject Invitation Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

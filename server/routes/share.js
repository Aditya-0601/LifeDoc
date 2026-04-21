const express = require('express');
const { getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Generate share link for document
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { documentId, expiresIn } = req.body;
    const userId = req.userId;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const pool = getDb();
    
    // Check if document belongs to user
    const docResult = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate unique share token
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7)); // Default 7 days

    // Store share link
    await pool.query(
      'INSERT INTO shared_links (document_id, token, expires_at) VALUES ($1, $2, $3)',
      [documentId, token, expiresAt]
    );

    const shareUrl = `${req.protocol}://${req.get('host')}/shared/${token}`;
    
    res.json({
      message: 'Share link generated successfully',
      shareUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Share link generation error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Access shared document
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const pool = getDb();

    // Find valid share link
    const linkResult = await pool.query(
      'SELECT d.*, sl.expires_at FROM shared_links sl JOIN documents d ON sl.document_id = d.id WHERE sl.token = $1 AND (sl.expires_at IS NULL OR sl.expires_at > NOW())',
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired share link' });
    }

    const document = linkResult.rows[0];
    
    res.json({
      message: 'Shared document accessed successfully',
      document: {
        id: document.id,
        title: document.title,
        category: document.category,
        file_name: document.file_name,
        file_size: document.file_size,
        created_at: document.created_at
      }
    });
  } catch (error) {
    console.error('Shared document access error:', error);
    res.status(500).json({ error: 'Failed to access shared document' });
  }
});

// Get all shared links for user
router.get('/links', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const pool = getDb();

    const result = await pool.query(
      `SELECT sl.*, d.title, d.file_name 
       FROM shared_links sl 
       JOIN documents d ON sl.document_id = d.id 
       WHERE d.user_id = $1 
       ORDER BY sl.created_at DESC`,
      [userId]
    );

    res.json({
      message: 'Shared links retrieved successfully',
      links: result.rows
    });
  } catch (error) {
    console.error('Get shared links error:', error);
    res.status(500).json({ error: 'Failed to retrieve shared links' });
  }
});

// Delete share link
router.delete('/links/:linkId', authenticate, async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.userId;
    const pool = getDb();

    // Verify ownership
    const result = await pool.query(
      `DELETE FROM shared_links 
       WHERE id = $1 
       AND document_id IN (SELECT id FROM documents WHERE user_id = $2)`,
      [linkId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    res.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Delete share link error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

module.exports = router;

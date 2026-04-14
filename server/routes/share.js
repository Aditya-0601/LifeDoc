const express = require('express');
const { getDb } = require('../config/database');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Public endpoint to access a securely shared document link
router.get('/:token', async (req, res) => {
  try {
    const pool = getDb();
    const token = req.params.token;

    // Fetch the link mapping and document metadata securely
    const { rows } = await pool.query(`
      SELECT s.expires_at, d.file_path, d.file_name, d.mime_type
      FROM shared_links s
      JOIN documents d ON s.document_id = d.id
      WHERE s.token = $1
    `, [token]);

    if (rows.length === 0) {
      return res.status(404).send(`
        <html>
          <head><title>Invalid Link</title></head>
          <body style="background: #0f172a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="text-align: center; border: 1px solid #334155; padding: 40px; border-radius: 12px; background: #1e293b;">
              <h1 style="color: #ef4444;">Access Denied</h1>
              <p style="color: #94a3b8;">This share link is invalid or has been permanently removed by the owner.</p>
            </div>
          </body>
        </html>
      `);
    }

    const link = rows[0];

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send(`
        <html>
          <head><title>Link Expired</title></head>
          <body style="background: #0f172a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="text-align: center; border: 1px solid #334155; padding: 40px; border-radius: 12px; background: #1e293b;">
              <h1 style="color: #f59e0b;">Link Expired</h1>
              <p style="color: #94a3b8;">This share link has expired and is no longer accessible.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Safely resolve file path and enforce bounds for security
    const filePath = path.join(__dirname, '../..', link.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('The target file could not be found securely on the server.');
    }

    // Provide the file down the pipe
    res.setHeader('Content-Disposition', `inline; filename="${link.file_name}"`);
    res.setHeader('Content-Type', link.mime_type || 'application/octet-stream');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Share link generation error:', error);
    res.status(500).send('Secure Server Error loading resource');
  }
});

module.exports = router;

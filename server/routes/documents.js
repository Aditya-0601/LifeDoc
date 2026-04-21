const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../config/database');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check authentication early
    if (!req.userId) {
      console.error('❌ Multer Error: No userId on request object');
      return cb(new Error('Authentication failed: No User ID found.'));
    }

    try {
      const userDir = path.join(uploadsDir, req.userId.toString());
      if (!fs.existsSync(userDir)) {
        console.log(`📁 Creating user directory: ${userDir}`);
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } catch (err) {
      console.error('❌ Multer Directory Error:', err);
      cb(new Error('Internal Server Error: Failed to prepare storage directory.'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set(['.jpeg', '.jpg', '.png', '.pdf', '.doc', '.docx']);
    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    const extname = path.extname(file.originalname).toLowerCase();
    const isValidExtension = allowedExtensions.has(extname);
    const isValidMimeType = allowedMimeTypes.has(file.mimetype);

    if (isValidExtension && isValidMimeType) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});
const uploadSingle = upload.single('file');

// Helper for extracting dates from OCR text
const extractDateFromText = (text) => {
  // Matches dd/mm/yyyy, yyyy-mm-dd, etc.
  const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/;
  const match = text.match(dateRegex);
  return match ? match[0] : null;
};

const mapDocument = (req, doc) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    ...doc, // Backward compatibility
    id: doc.id,
    name: doc.title,
    category: doc.category,
    expiryDate: doc.expiry_date,
    createdAt: doc.created_at,
    fileName: doc.file_name,
    fileType: path.extname(doc.file_name || '').toLowerCase().replace('.', '') || 'unknown',
    fileUrl: `${baseUrl}${doc.file_path}`,
    isShared: !!doc.is_shared,
    isLocked: !!doc.is_locked,
    isFavorite: !!doc.is_favorite,
    ownerName: doc.owner_name,
    sharedByUserId: doc.is_shared ? doc.user_id : null,
    sharedByName: doc.is_shared ? doc.owner_name : null,
    sharedByEmail: doc.is_shared ? doc.owner_email : null
  };
};

// Upload document
router.post('/upload', authenticate, (req, res) => {
  uploadSingle(req, res, async (uploadError) => {
    if (uploadError) {
      const isFileSizeError = uploadError.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        error: isFileSizeError
          ? 'File too large. Maximum allowed size is 10MB.'
          : uploadError.message || 'File upload failed.'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const pool = getDb();
      let finalFilePath = req.file.path;
      let finalSize = req.file.size;
      let detectedExpiryDate = null;
      let isImage = false;

      // --- Smart Processing: OCR & Compression ---
      // Wrapped in try-catch so that if heavy dependencies fail, the upload still succeeds
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();

        if (['.jpeg', '.jpg', '.png'].includes(ext)) {
          isImage = true;
          try {
            console.log(`🖼️ Optimizing image: ${req.file.originalname}`);
            const compressedPath = req.file.path.replace(ext, `-compressed${ext}`);
            await sharp(req.file.path)
              .jpeg({ quality: 75 })
              .toFile(compressedPath);

            // Swap references to use compressed file
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            finalFilePath = compressedPath;
            const stats = fs.statSync(compressedPath);
            finalSize = stats.size;
            req.file.path = compressedPath;
            req.file.filename = path.basename(compressedPath);

            console.log(`🔍 Running OCR on: ${req.file.originalname}`);
            const { data: { text } } = await Tesseract.recognize(compressedPath, 'eng');
            detectedExpiryDate = extractDateFromText(text);
          } catch (procErr) {
            console.warn('⚠️ Image processing (Sharp/OCR) failed, continuing with original:', procErr.message);
          }
        } else if (ext === '.pdf') {
          try {
            console.log(`📑 Parsing PDF text: ${req.file.originalname}`);
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(dataBuffer);
            detectedExpiryDate = extractDateFromText(data.text);
          } catch (procErr) {
            console.warn('⚠️ PDF parsing failed, continuing:', procErr.message);
          }
        }
      } catch (outerProcErr) {
        console.error('❌ Smart processing failed unexpectedly:', outerProcErr);
      }
      // --- End Smart Processing ---

      const relativePath = `/uploads/${req.userId}/${req.file.filename}`;

      const { title, category, description, expiry_date } = req.body;

      try {
        const result = await pool.query(
          `INSERT INTO documents (user_id, title, category, file_name, file_path, file_size, mime_type, description, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at`,
          [
            req.userId,
            title || req.file.originalname,
            category || 'other',
            req.file.originalname,
            relativePath,
            finalSize,
            req.file.mimetype,
            description || '',
            expiry_date || null
          ]
        );

        const newDoc = result.rows[0];

        if (detectedExpiryDate) {
          try {
            await pool.query(
              `INSERT INTO deadlines (user_id, document_id, title, description, deadline_date, reminder_days, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                req.userId,
                newDoc.id,
                `Renew: ${title || req.file.originalname}`,
                `Automatically created reminder for document expiry`,
                detectedExpiryDate,
                30,
                category || 'other'
              ]
            );
            console.log('✅ Automated reminder created for expiry date:', detectedExpiryDate);
          } catch (dbErr) {
            console.error('Error automatically creating deadline:', dbErr);
          }
        }

        res.status(201).json({
          message: 'Document uploaded successfully',
          document: mapDocument(req, {
            id: newDoc.id,
            title: title || req.file.originalname,
            category: category || 'other',
            file_name: req.file.originalname,
            file_path: relativePath,
            created_at: newDoc.created_at,
            expiry_date: expiry_date || null,
            description: description || '',
            mime_type: req.file.mimetype,
            file_size: finalSize,
            user_id: req.userId
          }),
          metadata: {
            wasCompressed: isImage,
            originalSize: req.file.size,
            compressedSize: finalSize,
            suggestedExpiryDate: detectedExpiryDate
          }
        });
      } catch (dbErr) {
        if (fs.existsSync(finalFilePath)) {
          fs.unlinkSync(finalFilePath);
        }
        throw dbErr;
      }
    } catch (error) {
      console.error('Upload Error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Search documents
router.get('/search', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { q } = req.query;

    if (!q) {
      return res.json({ documents: [] });
    }

    const { rows } = await pool.query(
      `SELECT d.*, 
              CASE WHEN d.user_id = $1 THEN false ELSE true END as is_shared,
              u.name as owner_name,
              u.email as owner_email
       FROM documents d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE (d.user_id = $1 OR d.user_id IN (
           SELECT user_id FROM family_access WHERE family_member_email = (SELECT email FROM users WHERE id = $1) AND status = 'approved'
       ))
       AND (d.title ILIKE $2 OR d.category ILIKE $2 OR d.description ILIKE $2)
       ORDER BY d.created_at DESC`,
      [req.userId, `%${q}%`]
    );

    res.json({ documents: rows.map(doc => mapDocument(req, doc)) });
  } catch (error) {
    console.error('Search Documents Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all documents
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { category } = req.query;

    let query = `
      SELECT d.*, 
             CASE WHEN d.user_id = $1 THEN false ELSE true END as is_shared,
             u.name as owner_name,
             u.email as owner_email
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE (d.user_id = $1 OR d.user_id IN (
          SELECT user_id FROM family_access WHERE family_member_email = (SELECT email FROM users WHERE id = $1) AND status = 'approved'
      ))
    `;
    const params = [req.userId];

    if (category) {
      query += ' AND d.category = $2';
      params.push(category);
    }

    query += ' ORDER BY d.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ documents: rows.map(doc => mapDocument(req, doc)) });
  } catch (error) {
    console.error('Fetch Documents Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lock document
router.patch('/:id/lock', authenticate, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    const { passcode } = req.body;
    if (!passcode || passcode.trim() === '') {
      return res.status(400).json({ error: 'Passcode is required to lock document' });
    }

    const pool = getDb();
    const docId = parseInt(req.params.id);
    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    
    // Ensure document exists and belongs exclusively to the user (security mechanism)
    const checkDoc = await pool.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [docId, req.userId]);
    if (checkDoc.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }
    
    const hashedPasscode = await bcrypt.hash(passcode.toString(), 10);
    
    await pool.query(
      'UPDATE documents SET is_locked = 1, passcode_hash = $1 WHERE id = $2 AND user_id = $3',
      [hashedPasscode, docId, req.userId]
    );

    res.json({ message: 'Document locked successfully' });
  } catch (err) {
    console.error('Lock Error:', err);
    res.status(500).json({ error: 'Server error during lock operation' });
  }
});

// Unlock Document Validation
router.post('/:id/unlock', authenticate, async (req, res) => {
  try {
    const { passcode } = req.body;
    const pool = getDb();
    const docId = parseInt(req.params.id);

    // Grab doc mapping (including shared permissions logic potentially if accessed, but here isolating to user validation)
    const checkDoc = await pool.query('SELECT * FROM documents WHERE id = $1', [docId]);
    const document = checkDoc.rows[0];

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.is_locked) {
      return res.json({ success: true, message: 'Document is not locked' });
    }

    if (!passcode) {
      return res.status(401).json({ error: 'Passcode is required to unlock this document' });
    }

    const isMatch = await bcrypt.compare(passcode.toString(), document.passcode_hash);
    
    if (!isMatch) {
       return res.status(401).json({ error: 'Incorrect passcode' });
    }

    res.json({ success: true, message: 'Passcode accepted' });
  } catch (err) {
    console.error('Unlock Validation Error:', err);
    res.status(500).json({ error: 'Server error during unlock computation' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: mapDocument(req, rows[0]) });
  } catch (error) {
    console.error('Fetch Document Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle document favorite status
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const docId = parseInt(req.params.id);

    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Verify ownership of document
    const { rows } = await pool.query(
      'SELECT id, is_favorite FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Toggle the value
    const newStatus = rows[0].is_favorite ? 0 : 1;

    await pool.query(
      'UPDATE documents SET is_favorite = $1 WHERE id = $2',
      [newStatus, docId]
    );

    res.json({ message: 'Favorite status updated', isFavorite: !!newStatus });
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download document
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    const document = rows[0];
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const cleanPath = document.file_path.startsWith('/') ? document.file_path.slice(1) : document.file_path;
    const filePath = path.join(__dirname, '../../', cleanPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, document.file_name);
  } catch (error) {
    console.error('Download Document Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const docId = parseInt(req.params.id);

    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    console.log(`[DELETE] User ${req.userId} is trying to delete document ${docId}`);

    // First get the document to delete the file from the filesystem
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.userId]
    );

    const document = rows[0];

    if (!document) {
      console.warn(`[DELETE] Document ${docId} not found or access denied for user ${req.userId}`);
      return res.status(404).json({ error: 'Document not found' });
    }

    const cleanPath = document.file_path.startsWith('/') ? document.file_path.slice(1) : document.file_path;
    const filePath = path.join(__dirname, '../../', cleanPath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileErr) {
        console.warn('Could not delete file from disk (might be locked/missing):', fileErr.message);
      }
    }

    // Delete from database
    await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.userId]
    );

    // Create Notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, description, type) VALUES ($1, $2, $3, $4)`,
      [req.userId, 'Document Deleted', `Document ${document.title} was safely removed.`, 'security']
    );
    console.log("Notification created");

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Share document via secure link
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const docId = parseInt(req.params.id);
    const { expires_in_days } = req.body;

    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Verify ownership
    const { rows } = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry
    let expiresAt = null;
    if (expires_in_days && !isNaN(expires_in_days) && expires_in_days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expires_in_days));
      expiresAt = d;
    }

    // Insert into shared_links
    await pool.query(
      `INSERT INTO shared_links (document_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [docId, token, expiresAt]
    );

    const shareUrl = `${req.protocol}://${req.get('host')}/api/share/${token}`;

    res.status(201).json({
      message: 'Secure share link generated',
      shareUrl,
      expiresAt
    });
  } catch (error) {
    console.error('Share Document Error:', error);
    res.status(500).json({ error: 'Server error generating link' });
  }
});

// GET previous versions of a document
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const docId = parseInt(req.params.id);

    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Verify ownership
    const { rows: docRows } = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [docId, req.userId]
    );

    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM document_versions WHERE document_id = $1 ORDER BY created_at DESC',
      [docId]
    );

    res.json({ versions: rows });
  } catch (error) {
    console.error('Fetch Document Versions Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload a new version to an existing document
router.post('/:id/versions', authenticate, (req, res) => {
  uploadSingle(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message || 'File upload failed.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const pool = getDb();
      const docId = parseInt(req.params.id);

      if (isNaN(docId)) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid document ID' });
      }

      // Verify ownership
      const { rows: docRows } = await pool.query(
        'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
        [docId, req.userId]
      );

      if (docRows.length === 0) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Document not found' });
      }

      const existingDoc = docRows[0];
      let finalFilePath = req.file.path;
      let finalSize = req.file.size;
      let detectedExpiryDate = null;
      let isImage = false;

      // Smart Processing: OCR & Compression
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();

        if (['.jpeg', '.jpg', '.png'].includes(ext)) {
          isImage = true;
          try {
            const compressedPath = req.file.path.replace(ext, `-compressed${ext}`);
            await sharp(req.file.path).jpeg({ quality: 75 }).toFile(compressedPath);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            finalFilePath = compressedPath;
            finalSize = fs.statSync(compressedPath).size;
            req.file.path = compressedPath;
            req.file.filename = path.basename(compressedPath);

            const { data: { text } } = await Tesseract.recognize(compressedPath, 'eng');
            detectedExpiryDate = extractDateFromText(text);
          } catch (procErr) {
            console.warn('Image processing failed:', procErr.message);
          }
        } else if (ext === '.pdf') {
          try {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(dataBuffer);
            detectedExpiryDate = extractDateFromText(data.text);
          } catch (procErr) {
            console.warn('PDF parsing failed:', procErr.message);
          }
        }
      } catch (outerProcErr) {
        console.error('Smart processing failed:', outerProcErr);
      }

      const relativePath = `/uploads/${req.userId}/${req.file.filename}`;

      try {
        await pool.query('BEGIN');

        // 1. Archive current document into document_versions
        await pool.query(
          `INSERT INTO document_versions (document_id, file_name, file_path, file_size, mime_type, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            existingDoc.id,
            existingDoc.file_name,
            existingDoc.file_path,
            existingDoc.file_size,
            existingDoc.mime_type,
            existingDoc.created_at
          ]
        );

        // 2. Update documents table with new file info
        const result = await pool.query(
          `UPDATE documents SET file_name = $1, file_path = $2, file_size = $3, mime_type = $4, created_at = CURRENT_TIMESTAMP
           WHERE id = $5 RETURNING *`,
          [req.file.originalname, relativePath, finalSize, req.file.mimetype, existingDoc.id]
        );

        await pool.query('COMMIT');

        res.status(201).json({
          message: 'New version uploaded successfully',
          document: mapDocument(req, result.rows[0])
        });
      } catch (dbErr) {
        await pool.query('ROLLBACK');
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        throw dbErr;
      }
    } catch (error) {
      console.error('Upload Version Error:', error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Download previous version of a document
router.get('/version/:vid/download', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const vid = parseInt(req.params.vid);

    if (isNaN(vid)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    // Verify ownership via join
    const { rows } = await pool.query(`
      SELECT v.* 
      FROM document_versions v
      JOIN documents d ON v.document_id = d.id
      WHERE v.id = $1 AND d.user_id = $2
    `, [vid, req.userId]);

    const version = rows[0];
    if (!version) {
      return res.status(404).json({ error: 'Version not found or access denied' });
    }

    const filePath = path.join(__dirname, '../..', version.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Historical file securely removed or missing from server' });
    }

    res.download(filePath, version.file_name);
  } catch (error) {
    console.error('Download Version Error:', error);
    res.status(500).json({ error: 'Server error parsing historical file' });
  }
});

module.exports = router;

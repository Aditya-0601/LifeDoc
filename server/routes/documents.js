const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
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
    const userDir = path.join(uploadsDir, req.userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
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
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Helper for extracting dates from OCR text
const extractDateFromText = (text) => {
  // Matches dd/mm/yyyy, yyyy-mm-dd, etc.
  const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/;
  const match = text.match(dateRegex);
  return match ? match[0] : null;
};

// Upload document
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, category, description, expiry_date } = req.body;
    const pool = getDb();

    let finalFilePath = req.file.path;
    let finalSize = req.file.size;
    let detectedExpiryDate = null;
    let isImage = false;

    // Check if the file is an image
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (['.jpeg', '.jpg', '.png'].includes(ext)) {
      isImage = true;
      try {
        // 1. Image Compression (Optimization)
        const compressedPath = req.file.path.replace(ext, `-compressed${ext}`);
        await sharp(req.file.path)
          .jpeg({ quality: 70 }) // compress image
          .toFile(compressedPath);

        // Replace original with compressed version
        fs.unlinkSync(req.file.path);
        finalFilePath = compressedPath;
        const stats = fs.statSync(compressedPath);
        finalSize = stats.size;

        // Update the express req file references to reflect the new file
        req.file.path = compressedPath;
        req.file.filename = path.basename(compressedPath);

        // 2. OCR for Smart Expiry Detection
        console.log(`Running OCR on uploaded document: ${req.file.originalname}...`);
        const { data: { text } } = await Tesseract.recognize(compressedPath, 'eng');
        detectedExpiryDate = extractDateFromText(text);
        if (detectedExpiryDate) {
          console.log(`✅ OCR detected potential date: ${detectedExpiryDate}`);
        }
      } catch (err) {
        console.error('Error during compression or OCR:', err);
        // Fallback to storing uncompressed image if it fails
      }
    } else if (ext === '.pdf') {
      try {
        console.log(`Running PDF parsing on uploaded document: ${req.file.originalname}...`);
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        detectedExpiryDate = extractDateFromText(data.text);
        if (detectedExpiryDate) {
          console.log(`✅ PDF parse detected potential date: ${detectedExpiryDate}`);
        }
      } catch (err) {
        console.error('Error during PDF parsing:', err);
      }
    }

    const relativePath = `/uploads/${req.userId}/${req.file.filename}`;

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
        document: {
          id: newDoc.id,
          title: title || req.file.originalname,
          category: category || 'other',
          file_name: req.file.originalname,
          file_path: relativePath,
          created_at: newDoc.created_at
        },
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

// Search documents
router.get('/search', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const { q } = req.query;
    
    if (!q) {
      return res.json({ documents: [] });
    }

    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 AND (title ILIKE $2 OR category ILIKE $2 OR description ILIKE $2) ORDER BY created_at DESC',
      [req.userId, `%${q}%`]
    );
    
    res.json({ documents: rows });
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

    let query = 'SELECT * FROM documents WHERE user_id = $1';
    const params = [req.userId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ documents: rows });
  } catch (error) {
    console.error('Fetch Documents Error:', error);
    res.status(500).json({ error: 'Server error' });
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
    
    res.json({ document: rows[0] });
  } catch (error) {
    console.error('Fetch Document Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const pool = getDb();
    
    // First get the document to delete the file from the filesystem
    const { rows } = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    const document = rows[0];

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete the file
    const filePath = path.join(__dirname, '../..', document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

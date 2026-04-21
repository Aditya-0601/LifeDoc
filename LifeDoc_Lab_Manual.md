
---

# **LifeDoc — Intelligent Document Vault**

## Lab Manual & User Manual

---

| | |
|---|---|
| **Project Name** | LifeDoc — Intelligent Personal Document Vault |
| **Version** | 1.0.0 |
| **Date** | April 2026 |
| **Project Type** | Full-Stack Web Application (Software Engineering Lab) |
| **Tech Stack** | React 18, Node.js, Express.js, PostgreSQL, Tailwind CSS |
| **Platform** | Cross-Platform (Windows / macOS / Linux) — Web Browser |
| **License** | MIT |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Installation & Setup Guide](#3-installation--setup-guide)
4. [Working / Execution Steps](#4-working--execution-steps)
5. [Code & Implementation](#5-code--implementation)
6. [Input / Output Explanation](#6-input--output-explanation)
7. [Key Concepts & Theory](#7-key-concepts--theory)
8. [CLI & API Command Reference](#8-cli--api-command-reference)
9. [Errors & Troubleshooting](#9-errors--troubleshooting)
10. [Conclusion](#10-conclusion)
11. [Viva Questions & Answers](#11-viva-questions--answers)

---

## 1. Project Overview

### 1.1 What is LifeDoc?

**LifeDoc** is a secure, intelligent personal document management system that acts as a digital vault for life-critical documents — passports, insurance policies, medical records, property papers, certificates, and more.

It combines document storage with smart features like **OCR-based expiry detection**, **deadline reminders**, **version control**, **cryptographic link sharing**, and **family access management** — all behind a modern, glassmorphism-styled dark-mode interface.

### 1.2 Problem Statement

In daily life, people struggle with:
- **Misplacing** important physical documents (passports, insurance policies, etc.).
- **Missing renewal deadlines** due to poor tracking of expiry dates.
- **Insecure sharing** of sensitive documents via email or messaging apps.
- **No version control** — overwriting an old scan with a new one permanently destroys the original.
- **No centralized access** for families who need to share vital records.

LifeDoc solves all of these problems in a single unified platform.

### 1.3 Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Secure Document Vault** | Upload, store, preview, and download documents with authenticated access |
| 2 | **Smart OCR Processing** | Automatically extracts text from images/PDFs and detects expiry dates using Tesseract.js |
| 3 | **Image Compression** | Uploaded images are auto-compressed using Sharp to reduce storage usage |
| 4 | **Category Organization** | Documents organized by categories: Identity, Medical, Property, Insurance, Financial, Other |
| 5 | **Favorite Documents** | Star important documents for quick Dashboard access |
| 6 | **Version History** | Upload new versions of documents while keeping full archival history of older files |
| 7 | **Secure Link Sharing** | Generate cryptographically random time-limited public download links |
| 8 | **Deadline & Reminder Engine** | Track document expiry dates with automated cron-based reminders |
| 9 | **Family Access Management** | Invite trusted family members to view your vault via invitation codes |
| 10 | **Global Search** | Search across all documents, reminders, and family members from a single bar |
| 11 | **Real-Time Notifications** | Security alerts, upload confirmations, and deadline warnings |
| 12 | **Vault Analytics Dashboard** | Visual SVG donut charts and bar charts showing category distribution and expiry timelines |
| 13 | **Admin Panel** | System-wide statistics dashboard for platform administrators |
| 14 | **JWT Authentication** | Stateless, token-based authentication with bcrypt password hashing |

### 1.4 Comparison with Existing Systems

| Feature | Google Drive | Digilocker | LifeDoc |
|---------|-------------|------------|---------|
| Document Storage | ✅ | ✅ | ✅ |
| Expiry Date Tracking | ❌ | ❌ | ✅ (OCR + manual) |
| Automated Reminders | ❌ | ❌ | ✅ (cron-based) |
| Version History | ✅ | ❌ | ✅ |
| Secure Time-Limited Sharing | ❌ | ✅ (limited) | ✅ (fully configurable) |
| Family Vault Access | ❌ | ❌ | ✅ |
| Category-Based Analytics | ❌ | ❌ | ✅ |
| Self-Hosted / Offline Capable | ❌ | ❌ | ✅ |
| OCR Auto-Detection | ❌ | ❌ | ✅ |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Landing  │  │Dashboard │  │Documents │  │ Reminders│   │
│   │  Page    │  │  Index   │  │  Page    │  │   Page   │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  Login   │  │ Upload   │  │ Family   │  │ Profile  │   │
│   │  Page    │  │  Page    │  │  Access  │  │   Page   │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│   React 18 (CDN) + React Router 6 + Framer Motion + Axios  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP / REST API (JSON)
                       │  JWT Bearer Token Authentication
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    SERVER (Node.js)                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │               Express.js Application                │   │
│   │                                                     │   │
│   │  Middleware: CORS │ JSON Parser │ JWT Auth           │   │
│   │                                                     │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│   │  │ Auth     │ │Documents │ │Deadlines │            │   │
│   │  │ Routes   │ │ Routes   │ │ Routes   │            │   │
│   │  └──────────┘ └──────────┘ └──────────┘            │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│   │  │ Family   │ │ Share    │ │Analytics │            │   │
│   │  │ Routes   │ │ Routes   │ │ Routes   │            │   │
│   │  └──────────┘ └──────────┘ └──────────┘            │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│   │  │Reminders │ │Notif.    │ │ Admin    │            │   │
│   │  │ Routes   │ │ Routes   │ │ Routes   │            │   │
│   │  └──────────┘ └──────────┘ └──────────┘            │   │
│   │                                                     │   │
│   │  Services: Reminder Cron │ OCR Engine │ File I/O    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Dependencies: Multer │ Sharp │ Tesseract.js │ PDFParse   │
│                 bcryptjs │ jsonwebtoken │ node-cron         │
└──────────────────────┬──────────────────────────────────────┘
                       │  SQL Queries (pg driver)
                       │  SSL/TLS Encrypted Connection
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│                                                             │
│   Tables:                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│   │   users      │ │  documents  │ │   deadlines         │  │
│   │             │ │             │ │                     │  │
│   │ id (PK)     │ │ id (PK)     │ │ id (PK)             │  │
│   │ email       │ │ user_id(FK) │ │ user_id (FK)        │  │
│   │ password    │ │ title       │ │ document_id (FK)    │  │
│   │ name        │ │ category    │ │ title               │  │
│   │ otp         │ │ file_name   │ │ deadline_date       │  │
│   │ otp_expiry  │ │ file_path   │ │ reminder_days       │  │
│   │ is_active   │ │ file_size   │ │ is_completed        │  │
│   └─────────────┘ │ is_favorite │ └─────────────────────┘  │
│                   │ expiry_date │                           │
│   ┌─────────────┐ └─────────────┘ ┌─────────────────────┐  │
│   │family_access│                 │  notifications      │  │
│   │             │ ┌─────────────┐ │                     │  │
│   │ user_id(FK) │ │shared_links │ │ user_id (FK)        │  │
│   │ member_email│ │             │ │ title               │  │
│   │ access_code │ │ doc_id (FK) │ │ type                │  │
│   │ status      │ │ token       │ │ is_read             │  │
│   └─────────────┘ │ expires_at  │ └─────────────────────┘  │
│                   └─────────────┘                           │
│   ┌─────────────────────┐  ┌────────────────────────────┐   │
│   │  document_versions  │  │     reminders_sent         │   │
│   │                     │  │                            │   │
│   │  document_id (FK)   │  │  deadline_id (FK)          │   │
│   │  file_name          │  │  user_id (FK)              │   │
│   │  file_path          │  │  reminder_date             │   │
│   │  file_size          │  │  sent_at                   │   │
│   └─────────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend Framework | React 18 (CDN-based) | Component-based UI rendering |
| UI Styling | Tailwind CSS (CDN) | Utility-first responsive styling |
| Animations | Framer Motion 10.x | Page transitions, modal animations |
| HTTP Client | Axios | REST API communication with JWT headers |
| Routing | React Router DOM 6.x | Client-side SPA routing (HashRouter) |
| Backend Runtime | Node.js 18+ | Server-side JavaScript execution |
| Web Framework | Express.js 4.x | REST API routing, middleware pipeline |
| Database | PostgreSQL (Neon/local) | Persistent relational data storage |
| DB Driver | pg 8.x | Node.js ↔ PostgreSQL communication |
| Authentication | jsonwebtoken + bcryptjs | JWT token issuance, password hashing |
| File Upload | Multer 1.4.x | Multipart form-data file handling |
| Image Processing | Sharp 0.32.x | JPEG compression, format conversion |
| OCR Engine | Tesseract.js 5.x | Optical Character Recognition for expiry detection |
| PDF Processing | pdf-parse 2.4.x | Text extraction from PDF documents |
| Cron Scheduler | node-cron 3.x | Automated daily reminder checks |
| Email (optional) | Nodemailer 6.x | SMTP-based email delivery |
| Dev Tools | Nodemon + Concurrently | Auto-restart server + parallel process runner |

### 2.3 Component Interaction Flow

```
User Action → React Component → Axios API Call → Express Route
    → JWT Middleware (verify token) → Controller Logic
    → PostgreSQL Query (pg driver) → JSON Response → React State Update → UI Re-render
```

**File Upload Flow:**
```
User selects file → Multer parses multipart form
    → Sharp compresses image (if applicable)
    → Tesseract.js runs OCR (if image)
    → pdf-parse extracts text (if PDF)
    → File saved to /uploads/{userId}/
    → Metadata inserted into documents table
    → Auto-deadline created if expiry date detected
```

---

## 3. Installation & Setup Guide

### 3.1 Prerequisites

| Software | Minimum Version | Purpose |
|----------|----------------|---------|
| Node.js | 18.0 or higher | JavaScript runtime |
| npm | 9.0 or higher | Package manager (bundled with Node.js) |
| Git | 2.30 or higher | Version control |
| PostgreSQL | 14.0 or higher (OR cloud provider) | Database engine |
| Web Browser | Chrome 100+ / Firefox 100+ / Edge 100+ | Frontend client |

> **💡 Tip:** If you don't have a local PostgreSQL installation, you can use a free cloud provider like **Neon** (https://neon.tech) — the project is pre-configured for it.

### 3.2 Setup on Windows

**Step 1: Clone the Repository**
```powershell
git clone https://github.com/Aditya-0601/LifeDoc.git
cd LifeDoc
```

**Step 2: Install Dependencies**
```powershell
npm install
```
> This installs all 15 production and 2 development dependencies listed in `package.json`.

**Step 3: Configure Environment Variables**

Create a `.env` file in the project root (or copy `.env.example`):
```powershell
copy .env.example .env
```

Edit `.env` with your credentials:
```ini
# Database Connection (use your own PostgreSQL URL)
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# JWT Secret (use a long random string)
JWT_SECRET=your_super_secret_key_here_min_32_chars

# Server Port
PORT=5000

# Admin Panel Secret
ADMIN_SECRET=your_admin_password
```

> **⚠️ Warning:** Never commit the `.env` file to version control. It contains sensitive credentials.

**Step 4: Start the Application**
```powershell
npm run dev
```

This command starts **both** the backend server (port 5000) and frontend client (port 3000) simultaneously using `concurrently`.

**Step 5: Verify**
- Open your browser and navigate to: `http://localhost:3000`
- You should see the LifeDoc landing page with the animated hero section.
- Check the terminal for: `🚀 LifeDoc server running on port 5000` and `📦 Connected to PostgreSQL database`.

### 3.3 Setup on macOS / Linux

**Step 1: Clone the Repository**
```bash
git clone https://github.com/Aditya-0601/LifeDoc.git
cd LifeDoc
```

**Step 2: Install Dependencies**
```bash
npm install
```

**Step 3: Configure Environment**
```bash
cp .env.example .env
nano .env   # or use vim / VS Code
```
Fill in the same variables as described in the Windows section above.

**Step 4: Start the Application**
```bash
npm run dev
```

**Step 5: Verify**
```bash
curl http://localhost:5000/api/health
# Expected output: {"status":"ok","message":"LifeDoc API is running"}
```

### 3.4 Database Initialization

The database schema is **auto-created** when the server starts. You do not need to run any SQL scripts manually. The system creates 8 tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with hashed passwords |
| `documents` | Document metadata and file paths |
| `deadlines` | Expiry dates and reminder configuration |
| `family_access` | Family member invitations and access status |
| `reminders_sent` | Log of delivered reminder notifications |
| `notifications` | In-app notification queue |
| `shared_links` | Cryptographic share tokens with expiry |
| `document_versions` | Archived file versions for version history |

---

## 4. Working / Execution Steps

### Experiment 1: User Registration & Authentication

**Objective:** Register a new user, log in, and verify JWT-based authentication.

**Procedure:**

1. Open `http://localhost:3000` in your browser.
2. Click **"Get Started"** on the landing page.
3. On the Registration page, enter:
   - Full Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `SecurePassword123`
4. Click **"Generate Secure Keys"**.
5. **Expected Output:** Redirect to Dashboard with welcome message "Welcome, Test".
6. Open browser DevTools → Application tab → Local Storage → Verify `token` key exists (this is the JWT).

---

### Experiment 2: Document Upload with OCR

**Objective:** Upload a document and observe automatic OCR-based expiry detection.

**Procedure:**

1. From the Dashboard, click **"Upload Document"**.
2. Fill in:
   - Title: `Test Passport`
   - Category: `Identity`
   - Description: `My passport scan`
3. Select any `.jpg` or `.png` image file containing a date.
4. Click **"Upload Document"**.
5. **Expected Output:**
   - Console shows: `🖼️ Optimizing image: ...` and `🔍 Running OCR on: ...`
   - Document appears in the Documents grid.
   - If a date was detected: automatic deadline created in Reminders.

> **💡 Tip:** To test OCR, use an image that contains clearly printed text with a date format like `12/05/2027`.

---

### Experiment 3: Version History

**Objective:** Upload a new version of an existing document and verify archival.

**Procedure:**

1. Go to **Documents** and click on any uploaded document to open Preview.
2. Scroll down to the **"Version History"** section.
3. Click **"Upload New Version"** and select a new file.
4. **Expected Output:**
   - The preview updates to show the new file.
   - The previous file appears as "Version 1" in the history list with a download button.

---

### Experiment 4: Secure Document Sharing

**Objective:** Generate a time-limited share link and verify public access.

**Procedure:**

1. Go to **Documents**, hover over a document card, click the **Share icon** (↑).
2. Set expiry to **"Expire in 24 Hours"**.
3. Click **"Generate Secure Link"**.
4. Copy the generated URL.
5. Open an **Incognito window** (not logged in) and paste the URL.
6. **Expected Output:** The document downloads/renders without requiring authentication.
7. Wait 24 hours (or manually update the database timestamp to the past) and revisit the URL.
8. **Expected Output:** Styled "Link Expired" page.

---

### Experiment 5: Family Access Sharing

**Objective:** Share vault access with a family member via invitation code.

**Procedure:**

1. Register a second account (e.g., `familymember@example.com`) in a different browser/incognito window.
2. From the first account, go to **Family** → click **"Add Family Member"**.
3. Enter the family member's email and click **"Send Invitation"**.
4. Log in as the family member → go to **Family** → accept the pending invitation.
5. **Expected Output:** The family member can now see the first user's documents marked with a "SHARED" badge.

---

### Experiment 6: Analytics Dashboard

**Objective:** Verify vault analytics visualization.

**Procedure:**

1. Upload at least 3 documents across different categories (Identity, Medical, Financial).
2. Create at least 2 reminders with deadlines within the next 30 days.
3. Navigate to the **Dashboard** and scroll to the bottom.
4. **Expected Output:**
   - **Donut Chart** shows category distribution with labeled percentages.
   - **Bar Chart** shows upcoming deadlines color-coded by urgency.

---

## 5. Code & Implementation

### 5.1 Project Directory Structure

```
LifeDoc/
├── .env                          # Environment configuration
├── .gitignore                    # Git exclusion rules
├── index.html                    # Main HTML entry point (loads all CDN scripts)
├── styles.css                    # Custom CSS (glassmorphism, gradients)
├── package.json                  # NPM dependencies and scripts
│
├── js/                           # Frontend source code
│   ├── App.jsx                   # Root React component with routing
│   ├── services/
│   │   └── api.js                # Axios instance with JWT interceptor
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication state provider
│   │   └── ToastContext.jsx      # Toast notification system
│   ├── components/
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── Hero.jsx              # Landing page hero animation
│   │   ├── Features.jsx          # Feature showcase section
│   │   └── ui/
│   │       ├── Icons.jsx         # 20+ SVG icon components
│   │       ├── GlassCard.jsx     # Glassmorphism card wrapper
│   │       └── Button.jsx        # Styled button component
│   └── pages/
│       ├── Landing.jsx           # Public landing page
│       ├── Login.jsx             # Authentication form
│       ├── Register.jsx          # Registration form
│       ├── Dashboard.jsx         # Main dashboard with analytics
│       ├── Documents.jsx         # Document grid + preview + sharing
│       ├── UploadDocument.jsx    # File upload form with drag-drop
│       ├── Reminders.jsx         # Deadline management interface
│       ├── FamilyAccess.jsx      # Family member management
│       ├── Notifications.jsx     # Notification center
│       ├── Profile.jsx           # User profile settings
│       └── AdminDashboard.jsx    # Admin statistics panel
│
├── server/                       # Backend source code
│   ├── index.js                  # Express app bootstrap + server start
│   ├── config/
│   │   └── database.js           # PostgreSQL connection + schema creation
│   ├── middleware/
│   │   └── auth.js               # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js               # POST /register, /login, /verify-otp
│   │   ├── documents.js          # CRUD + upload + versions + share
│   │   ├── deadlines.js          # CRUD for deadline management
│   │   ├── reminders.js          # Upcoming/completed reminder queries
│   │   ├── family.js             # Family invitation + acceptance
│   │   ├── notifications.js      # Notification CRUD
│   │   ├── share.js              # Public document download via token
│   │   ├── analytics.js          # Aggregated vault statistics
│   │   └── admin.js              # Admin panel statistics
│   ├── services/
│   │   └── reminderService.js    # Cron job for daily reminder checks
│   └── utils/
│       └── mailer.js             # Nodemailer SMTP configuration
│
└── uploads/                      # File storage directory (per-user)
    └── {userId}/                 # Isolated user folders
        └── {timestamp}-{random}.ext
```

### 5.2 Key Code: JWT Authentication Middleware

**File:** `server/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

// Middleware function that protects API routes
const authenticate = (req, res, next) => {
  // Extract token from the Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the same secret used to sign it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;  // Attach user ID to request object
    next();  // Allow the request to proceed
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { authenticate };
```

**Logic Explanation:**
1. Every authenticated API request carries a JWT in the `Authorization` header.
2. The middleware extracts it, verifies its signature against `JWT_SECRET`, and decodes the payload.
3. If valid, `req.userId` is populated and the request proceeds to the route handler.
4. If invalid/expired, a 401 Unauthorized response is returned immediately.

### 5.3 Key Code: Document Upload with Smart Processing

**File:** `server/routes/documents.js` (upload section, simplified)

```javascript
// POST /api/documents/upload — Upload a new document
router.post('/upload', authenticate, (req, res) => {
  uploadSingle(req, res, async (uploadError) => {
    // ... error handling ...

    let finalFilePath = req.file.path;
    let detectedExpiryDate = null;

    const ext = path.extname(req.file.originalname).toLowerCase();

    // STEP 1: Image Processing — Compress with Sharp
    if (['.jpeg', '.jpg', '.png'].includes(ext)) {
      const compressedPath = req.file.path.replace(ext, `-compressed${ext}`);
      await sharp(req.file.path)
        .jpeg({ quality: 75 })
        .toFile(compressedPath);
      fs.unlinkSync(req.file.path);       // Remove original
      finalFilePath = compressedPath;      // Use compressed version

      // STEP 2: OCR — Extract text using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(compressedPath, 'eng');
      detectedExpiryDate = extractDateFromText(text);  // Regex-based date finder
    }
    // STEP 3: PDF Processing
    else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      detectedExpiryDate = extractDateFromText(data.text);
    }

    // STEP 4: Save metadata to database
    const result = await pool.query(
      `INSERT INTO documents (...) VALUES (...) RETURNING id, created_at`,
      [req.userId, title, category, ...]
    );

    // STEP 5: Auto-create deadline if expiry date was detected
    if (detectedExpiryDate) {
      await pool.query(
        `INSERT INTO deadlines (...) VALUES (...)`,
        [req.userId, newDoc.id, `Renew: ${title}`, detectedExpiryDate, 30, category]
      );
    }
  });
});
```

### 5.4 Key Code: Secure Share Token Generation

**File:** `server/routes/documents.js` (share section)

```javascript
const crypto = require('crypto');

router.post('/:id/share', authenticate, async (req, res) => {
  // Verify the requesting user owns this document
  const { rows } = await pool.query(
    'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
    [docId, req.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  // Generate 32-byte (256-bit) cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');  // 64 hex characters

  // Calculate absolute expiry timestamp
  let expiresAt = null;
  if (expires_in_days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(expires_in_days));
    expiresAt = d;
  }

  // Store in database
  await pool.query(
    `INSERT INTO shared_links (document_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [docId, token, expiresAt]
  );

  // Return complete URL
  const shareUrl = `${req.protocol}://${req.get('host')}/api/share/${token}`;
  res.status(201).json({ shareUrl, expiresAt });
});
```

### 5.5 Key Code: Analytics API

**File:** `server/routes/analytics.js`

```javascript
router.get('/', authenticate, async (req, res) => {
  const pool = getDb();
  const userId = req.userId;

  // Category breakdown (for pie/donut chart)
  const catRes = await pool.query(
    'SELECT category, COUNT(*) as count FROM documents WHERE user_id = $1 GROUP BY category',
    [userId]
  );
  const byCategory = catRes.rows.map(row => ({
    name: row.category || 'other',
    value: parseInt(row.count) || 0
  }));

  // Upcoming expiries (for bar chart)
  const expDetailedRes = await pool.query(
    `SELECT title as name, (deadline_date::date - CURRENT_DATE) as days_left
     FROM deadlines
     WHERE user_id = $1 AND is_completed = 0
       AND deadline_date >= CURRENT_DATE
       AND deadline_date <= (CURRENT_DATE + INTERVAL '30 days')
     ORDER BY deadline_date ASC LIMIT 6`,
    [userId]
  );

  res.json({ totalDocuments, byCategory, expiringSoon });
});
```

---

## 6. Input / Output Explanation

### 6.1 User Registration

**Input:**
```json
POST /api/auth/register
{
  "name": "Aditya Sharma",
  "email": "aditya@example.com",
  "password": "MySecureP@ss123"
}
```

**Output (Success):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Aditya Sharma",
    "email": "aditya@example.com"
  }
}
```

### 6.2 Document Upload

**Input:** Multipart form-data with:
- `file`: A JPEG image (e.g., `passport_scan.jpg`, 2.4 MB)
- `title`: `"My Passport"`
- `category`: `"identity"`

**Output:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 5,
    "name": "My Passport",
    "category": "identity",
    "fileUrl": "http://localhost:5000/uploads/1/1713215678-compressed.jpeg",
    "fileType": "jpeg",
    "isFavorite": false
  },
  "metadata": {
    "wasCompressed": true,
    "originalSize": 2457600,
    "compressedSize": 614400,
    "suggestedExpiryDate": "12/05/2027"
  }
}
```

> **💡 Note:** The image was compressed from 2.4 MB → 0.6 MB (75% reduction) and an expiry date was auto-detected via OCR.

### 6.3 Share Link Generation

**Input:**
```json
POST /api/documents/5/share
{ "expires_in_days": 7 }
```

**Output:**
```json
{
  "message": "Secure share link generated",
  "shareUrl": "http://localhost:5000/api/share/a3f8b2c1d9e7...64hexchars",
  "expiresAt": "2026-04-26T01:15:00.000Z"
}
```

### 6.4 Analytics Response

**Input:**
```
GET /api/analytics
Authorization: Bearer <jwt_token>
```

**Output:**
```json
{
  "totalDocuments": 12,
  "byCategory": [
    { "name": "identity", "value": 4 },
    { "name": "medical", "value": 3 },
    { "name": "financial", "value": 3 },
    { "name": "insurance", "value": 2 }
  ],
  "expiringSoonCount": 3,
  "expiringSoon": [
    { "name": "Renew Car Insura…", "daysLeft": 5, "fullDate": "2026-04-24" },
    { "name": "Passport Expiry",  "daysLeft": 12, "fullDate": "2026-05-01" },
    { "name": "Health Checkup",   "daysLeft": 25, "fullDate": "2026-05-14" }
  ]
}
```

### 6.5 UI Screenshots Description

| Screen | Description |
|--------|-------------|
| **Landing Page** | Dark-themed hero section with animated vault graphic, feature cards, and CTA buttons |
| **Login Page** | Glassmorphism card with email/password fields and "Unlock Vault" button |
| **Dashboard** | 3 stat cards (Total Docs, Expiring Soon, Vault Encrypted), Recent Activity list, Upcoming Expiry list, Important Documents grid, SVG Donut Chart & Bar Chart analytics |
| **Documents Page** | Responsive grid of document cards with hover actions (Download, Star, Share, Delete), search bar, category filter, favorites toggle |
| **Preview Modal** | Document preview (image/PDF/file icon), Document Details panel, Version History list with "Upload New Version" button |
| **Share Modal** | Link expiry dropdown, "Generate Secure Link" button, copy URL field with "Copy Link" button |
| **Reminders Page** | Active deadlines list color-coded by urgency, completed reminders section |
| **Family Access** | Invitation form, pending/approved member list |

---

## 7. Key Concepts & Theory

### 7.1 JWT (JSON Web Token) Authentication

JWT is a **stateless** authentication mechanism. Unlike session-based auth (which stores session data on the server), JWT encodes user identity directly into the token.

**Structure:** `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9.          ← Header: algorithm used (HS256)
eyJ1c2VySWQiOjF9.              ← Payload: { userId: 1 }
SflKxwRJSMeKKF2QT4fwpMeJf36POk ← Signature: HMAC-SHA256(header + payload, secret)
```

**Advantage:** The server never stores session state — it simply verifies the signature mathematically. This makes horizontal scaling trivial.

### 7.2 bcrypt Password Hashing

Passwords are never stored as plain text. bcrypt applies:
1. **Salt generation** — random bytes prepended to the password.
2. **Key stretching** — multiple rounds of hashing (default: 12 rounds) to make brute-force attacks computationally expensive.

```
Input:   "MyPassword123"
Output:  "$2a$12$LJ3m4gOcV3QfKmb3/YrZVOx9HJwXCuMvR2FP9K6..."
```

Even if the database is breached, the passwords cannot be reversed.

### 7.3 OCR (Optical Character Recognition)

OCR converts **images of text** into **machine-readable text**. LifeDoc uses Tesseract.js (a WASM port of Google's Tesseract engine) to:

1. Analyze the pixel patterns of uploaded document images.
2. Identify character shapes using trained neural network models.
3. Output the recognized text string.
4. Apply regex pattern matching to detect date formats (e.g., `dd/mm/yyyy`).

### 7.4 REST API Design Principles

LifeDoc follows REST conventions:

| Principle | Implementation |
|-----------|---------------|
| **Stateless** | JWT token in every request; no server-side sessions |
| **Resource-based URLs** | `/api/documents`, `/api/deadlines`, `/api/analytics` |
| **HTTP Methods** | GET (read), POST (create), PATCH (update), DELETE (remove) |
| **Status Codes** | 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error |
| **JSON Format** | All request/response bodies use JSON |

### 7.5 CRON-Based Reminder Scheduling

LifeDoc uses `node-cron` to run a daily job that:
1. Queries all active (non-completed) deadlines.
2. Checks if `deadline_date - today ≤ reminder_days`.
3. If yes, creates a notification and optionally sends an email.
4. Logs the reminder in `reminders_sent` to prevent duplicate notifications.

**Cron Expression:** `0 9 * * *` → Runs at 9:00 AM every day.

### 7.6 Cryptographic Share Tokens

Share links use `crypto.randomBytes(32)` from Node.js's built-in crypto module. This generates 32 bytes (256 bits) of cryptographically secure randomness, rendered as 64 hexadecimal characters.

The probability of guessing a valid token is **1 in 2²⁵⁶** — effectively impossible.

---

## 8. CLI & API Command Reference

### 8.1 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all project dependencies |
| `npm run dev` | Start both backend (port 5000) and frontend (port 3000) simultaneously |
| `npm run server` | Start only the backend server with auto-reload (nodemon) |
| `npm run client` | Start only the frontend static file server |
| `npx kill-port 5000` | Kill any process occupying port 5000 (troubleshooting) |

### 8.2 REST API Endpoints

#### Authentication

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/register` | No | Create new account |
| POST | `/api/auth/login` | No | Log in, receive JWT |
| GET | `/api/auth/me` | Yes | Get current user profile |

#### Documents

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/api/documents` | Yes | List all user's documents |
| POST | `/api/documents/upload` | Yes | Upload a new document |
| GET | `/api/documents/:id` | Yes | Get single document details |
| PATCH | `/api/documents/:id/favorite` | Yes | Toggle favorite status |
| DELETE | `/api/documents/:id` | Yes | Delete a document permanently |
| GET | `/api/documents/:id/download` | Yes | Download document file |
| GET | `/api/documents/search?q=` | Yes | Search documents by keyword |
| POST | `/api/documents/:id/share` | Yes | Generate secure share link |
| GET | `/api/documents/:id/versions` | Yes | List version history |
| POST | `/api/documents/:id/versions` | Yes | Upload a new version |
| GET | `/api/documents/version/:vid/download` | Yes | Download historical version |

#### Public Share

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/api/share/:token` | **No** | Public file access via share token |

#### Deadlines & Reminders

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/api/deadlines` | Yes | List all deadlines |
| POST | `/api/deadlines` | Yes | Create a new deadline |
| PATCH | `/api/deadlines/:id` | Yes | Update a deadline |
| DELETE | `/api/deadlines/:id` | Yes | Delete a deadline |
| GET | `/api/reminders` | Yes | Get upcoming reminders |

#### Family Access

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/api/family-access` | Yes | List family members |
| POST | `/api/family-access/invite` | Yes | Send family invitation |
| POST | `/api/family-access/accept/:code` | Yes | Accept invitation |

#### Analytics & Notifications

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | `/api/analytics` | Yes | Vault statistics for charts |
| GET | `/api/notifications` | Yes | List notifications |
| GET | `/api/health` | No | Server health check |

---

## 9. Errors & Troubleshooting

| # | Problem | Cause | Solution |
|---|---------|-------|----------|
| 1 | `EADDRINUSE: port 5000 already in use` | Previous server process still running | Run: `npx kill-port 5000`, then restart |
| 2 | `password authentication failed for user 'postgres'` | Wrong database credentials in `.env` | Verify `DATABASE_URL` in `.env` matches your PostgreSQL setup |
| 3 | Dashboard shows "Loading dashboard..." forever | Backend server not running or crashed | Check terminal for errors; run `npm run server` |
| 4 | Analytics section does not appear | No documents uploaded yet, or analytics API error | Upload at least 1 document; check terminal for `Analytics Fetch Error` |
| 5 | Document upload fails with "File too large" | File exceeds 10 MB limit | Compress the file or use a smaller scan |
| 6 | Document upload fails with "Invalid file type" | Unsupported extension or MIME type | Use only: PDF, JPEG, JPG, PNG, DOC, DOCX |
| 7 | Share link shows "Access Denied" | Token was miscopied or document was deleted | Re-copy the full URL; re-generate if document was deleted |
| 8 | Share link shows "Link Expired" | Expiry time has passed | Generate a new share link from Documents page |
| 9 | OCR does not detect expiry date | Image text is blurry or date format unrecognized | Enter expiry date manually during upload |
| 10 | `Cannot find module 'sharp'` | Native binary not installed correctly | Run: `npm rebuild sharp` or delete `node_modules` and reinstall |
| 11 | Family member cannot see shared documents | Invitation not yet accepted | Ask family member to check Family page and accept the invitation |
| 12 | Version History not loading | Backend returned 500 error | Check server terminal logs; ensure `document_versions` table exists |
| 13 | SSL warning in terminal | pg library SSL mode alias issue | This is cosmetic — does not affect functionality |

---

## 10. Conclusion

### 10.1 What Was Achieved

LifeDoc successfully demonstrates the design and implementation of a **production-grade, full-stack web application** that solves a real-world problem — secure personal document management with intelligent automation.

The project encompasses:
- **Complete CRUD operations** for documents, deadlines, reminders, and notifications.
- **Security-first architecture** with JWT authentication, bcrypt hashing, and cryptographic share tokens.
- **Intelligent automation** including OCR-based date detection, image compression, and cron-based reminder scheduling.
- **Modern UI/UX** using glassmorphism design, dark mode, smooth animations, and custom SVG data visualizations.
- **Scalable architecture** with clean separation between frontend (React SPA) and backend (REST API), connected via a stateless JWT protocol.

### 10.2 Learning Outcomes

Upon completing this project, students will have gained hands-on experience with:

| Domain | Skills Acquired |
|--------|----------------|
| **Frontend Development** | React component architecture, state management, SPA routing, responsive design with Tailwind CSS, SVG chart rendering, animation with Framer Motion |
| **Backend Development** | RESTful API design, Express.js middleware pipeline, file upload handling with Multer, image processing with Sharp, cron job scheduling |
| **Database Design** | Relational schema design with foreign keys and cascading deletes, SQL aggregation queries, PostgreSQL-specific features (INTERVAL, date arithmetic) |
| **Security** | JWT-based stateless authentication, bcrypt password hashing, CORS configuration, input validation, cryptographic random token generation |
| **AI/ML Integration** | Tesseract.js OCR engine integration, regex-based date extraction from unstructured text |
| **DevOps** | Environment variable management, concurrent process orchestration, Git version control, cloud database integration (Neon) |
| **Software Engineering** | Modular code organization, error handling patterns, version control workflows, documentation practices |

---

## 11. Viva Questions & Answers

### Q1. What is LifeDoc and what problem does it solve?
**A:** LifeDoc is a secure personal document vault web application. It solves the problem of disorganized document storage by providing a centralized, authenticated platform to upload, organize, track expiry dates, share securely, and manage version history of important life documents like passports, insurance policies, and medical records.

---

### Q2. Explain the authentication mechanism used in LifeDoc.
**A:** LifeDoc uses **JWT (JSON Web Token)** authentication. When a user logs in, the server generates a signed token containing the `userId` and returns it. The client stores this token in `localStorage` and sends it as a `Bearer` token in the `Authorization` header with every API request. The server middleware verifies the token's signature using the `JWT_SECRET` environment variable before allowing access.

---

### Q3. How are passwords stored securely in the database?
**A:** Passwords are hashed using **bcrypt** with 12 salt rounds before storage. When a user logs in, the plaintext password is compared against the stored hash using `bcrypt.compare()`. The original password can never be recovered from the hash, even if the database is compromised.

---

### Q4. What is OCR and how is it used in this project?
**A:** OCR (Optical Character Recognition) is a technology that converts images of text into machine-readable text. LifeDoc uses **Tesseract.js** to scan uploaded document images, extract text content, and then applies regex pattern matching to automatically detect expiry dates (e.g., `dd/mm/yyyy`). This allows automatic creation of deadline reminders without manual data entry.

---

### Q5. How does the document version history feature work?
**A:** When a user uploads a new version of a document, the system uses a **database transaction** (`BEGIN → INSERT → UPDATE → COMMIT`) to: (1) archive the current document's file metadata into the `document_versions` table, and (2) update the main `documents` record with the new file's path, name, and size. This ensures atomicity — either both operations succeed, or neither does.

---

### Q6. Explain how secure document sharing works.
**A:** Sharing uses cryptographic tokens. When a user requests a share link, `crypto.randomBytes(32)` generates a 256-bit random token (64 hex characters). This token is stored in the `shared_links` table along with optional expiry. The public endpoint `/api/share/:token` verifies the token exists, checks expiry, and streams the file to the recipient — no authentication required. The token space (2²⁵⁶ possibilities) makes brute-force guessing infeasible.

---

### Q7. What database tables are used and how are they related?
**A:** LifeDoc uses 8 tables: `users`, `documents`, `deadlines`, `family_access`, `reminders_sent`, `notifications`, `shared_links`, and `document_versions`. Key relationships: `documents.user_id → users.id` (one-to-many), `deadlines.document_id → documents.id` (optional foreign key), `shared_links.document_id → documents.id` (one-to-many), `document_versions.document_id → documents.id` (one-to-many). Cascade deletes ensure referential integrity.

---

### Q8. What is the difference between REST and SOAP APIs?
**A:** REST (Representational State Transfer) uses standard HTTP methods (GET, POST, PATCH, DELETE) with lightweight JSON payloads and stateless communication. SOAP (Simple Object Access Protocol) uses XML-based messaging with a predefined contract (WSDL). LifeDoc uses REST because it is simpler, faster, and better suited for web/mobile frontends.

---

### Q9. How does the analytics feature aggregate data?
**A:** The `/api/analytics` endpoint runs two PostgreSQL aggregation queries: (1) `SELECT category, COUNT(*) FROM documents GROUP BY category` for category distribution, and (2) `SELECT title, (deadline_date::date - CURRENT_DATE) as days_left FROM deadlines WHERE ...` for upcoming expiries. Results are serialized as JSON arrays that the frontend renders as SVG donut and bar charts — using pure CSS/SVG, with no external charting library.

---

### Q10. What middleware is used in the Express.js pipeline?
**A:** LifeDoc uses: (1) **CORS** — enables cross-origin requests between port 3000 (frontend) and port 5000 (backend); (2) **express.json()** — parses JSON request bodies; (3) **express.urlencoded()** — parses URL-encoded form data; (4) **express.static()** — serves uploaded files from the `/uploads` directory; (5) **Custom JWT authenticate** — verifies Bearer tokens on protected routes; (6) **Multer** — handles multipart file upload processing.

---

### Q11. What is the role of `node-cron` in the project?
**A:** `node-cron` schedules a background task that runs daily at 9:00 AM (`0 9 * * *`). It queries all active deadlines where `deadline_date - today ≤ reminder_days`, creates notification entries, and optionally sends email alerts. The `reminders_sent` table prevents duplicate notifications for the same deadline.

---

### Q12. Explain the concept of "glassmorphism" used in the UI.
**A:** Glassmorphism is a modern UI design trend characterized by: (1) semi-transparent backgrounds using `rgba()` colors, (2) `backdrop-filter: blur()` for frosted-glass effects, (3) subtle border effects using `border: 1px solid rgba(255,255,255,0.1)`, and (4) shadow layers for depth. LifeDoc applies this pattern extensively via the `GlassCard` component for cards, modals, and panels.

---

### Q13. How does Multer handle file uploads?
**A:** Multer is Express middleware for handling `multipart/form-data`. In LifeDoc, it is configured with: (1) **diskStorage** — saves files to `/uploads/{userId}/` with unique timestamped filenames; (2) **fileFilter** — validates both file extension and MIME type against an allowlist; (3) **limits** — restricts file size to 10 MB. The uploaded file's metadata (path, size, mimetype) is available on `req.file`.

---

### Q14. What are the advantages of using PostgreSQL over MongoDB for this project?
**A:** LifeDoc's data is highly relational (users own documents, documents have versions, deadlines reference documents, family access links users). PostgreSQL provides: (1) **ACID transactions** for safe version history operations; (2) **Foreign key constraints** with cascading deletes for referential integrity; (3) **SQL aggregation** (`GROUP BY`, `COUNT`) for analytics; (4) **Date arithmetic** (`INTERVAL`, `CURRENT_DATE`) for deadline calculations. A document database like MongoDB would require application-level joins and lack these guarantees.

---

### Q15. How would you scale LifeDoc for 10,000+ users?
**A:** Scaling strategies include: (1) **Horizontal backend scaling** — deploy multiple Express instances behind a load balancer (JWT is stateless, so any instance can verify tokens); (2) **Connection pooling** — already implemented via `pg.Pool`; (3) **CDN for static assets** — serve uploaded files from S3/CloudFront instead of the local filesystem; (4) **Database indexing** — add indexes on `user_id`, `category`, and `deadline_date` columns; (5) **Caching** — use Redis for frequently accessed analytics data; (6) **Rate limiting** — add `express-rate-limit` middleware to prevent abuse.

---

*End of Lab Manual*

*LifeDoc v1.0.0 · Software Engineering Lab · April 2026*

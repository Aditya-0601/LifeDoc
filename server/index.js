require('dotenv').config({ path: './.env' });
console.log("DB URL:", process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database initialization
const db = require('./config/database');
db.init();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/family', require('./routes/family'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeDoc API is running' });
});

// Start reminder scheduler
require('./services/reminderService').start();

app.listen(PORT, () => {
  console.log(`🚀 LifeDoc server running on port ${PORT}`);
});

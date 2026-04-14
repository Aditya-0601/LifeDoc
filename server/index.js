require('dotenv').config({ path: './.env' });

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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/family-access', require('./routes/family'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeDoc API is running' });
});

const startServer = async () => {
  try {
    await db.init();
    // Start reminder scheduler only after DB is ready.
    require('./services/reminderService').start();
    app.listen(PORT, () => {
      console.log(`🚀 LifeDoc server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
};

startServer();

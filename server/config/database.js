const { Pool } = require('pg');

let pool = null;

const init = () => {
  return new Promise((resolve, reject) => {
    // Check if the user has provided a custom DATABASE_URL (like from Neon or Supabase)
    // If not, it defaults to a local Postgres which will fail if not installed,
    // so it's important to provide a DATABASE_URL for production.
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lifedoc';
    
    const isLocalConnection = /localhost|127\.0\.0\.1/.test(connectionString);
    const shouldUseSsl =
      process.env.DB_SSL === 'true' || (!isLocalConnection && process.env.DB_SSL !== 'false');

    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false
    });

    pool.connect((err, client, release) => {
      if (err) {
        console.error('Error acquiring client', err.stack);
        reject(err);
        return;
      }
      release(); // Release the client back to the pool
      console.log('📦 Connected to PostgreSQL database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise(async (resolve, reject) => {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        otp VARCHAR(6),
        otp_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Documents table
      `CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Deadlines table
      `CREATE TABLE IF NOT EXISTS deadlines (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        deadline_date DATE NOT NULL,
        reminder_days INTEGER DEFAULT 30,
        category VARCHAR(100) NOT NULL,
        is_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Family access table
      `CREATE TABLE IF NOT EXISTS family_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_member_email VARCHAR(255) NOT NULL,
        family_member_name VARCHAR(255) NOT NULL,
        access_code VARCHAR(255) UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Reminders log table
      `CREATE TABLE IF NOT EXISTS reminders_sent (
        id SERIAL PRIMARY KEY,
        deadline_id INTEGER NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reminder_date DATE NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (let i = 0; i < queries.length; i++) {
        const tableName = queries[i].match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
        console.log(`🛠️ Creating/verifying table: ${tableName}...`);
        await pool.query(queries[i]);
      }
      
      // Add missing columns if they didn't exist in the previous schema
      try {
        await pool.query('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
        console.log('✅ Added is_active column to users table');
      } catch(e) { /* Ignore if it already exists */ }
      
      try {
        await pool.query('ALTER TABLE documents ADD COLUMN expiry_date DATE');
        console.log('✅ Added expiry_date column to documents table');
      } catch(e) { /* Ignore if it already exists */ }
      
      try {
        await pool.query('ALTER TABLE documents ADD COLUMN is_favorite INTEGER DEFAULT 0');
        console.log('✅ Added is_favorite column to documents table');
      } catch(e) { /* Ignore if it already exists */ }
      
      try {
        await pool.query("ALTER TABLE family_access ADD COLUMN status VARCHAR(20) DEFAULT 'pending'");
        console.log('✅ Added status column to family_access table');
      } catch(e) { /* Ignore if it already exists */ }

      console.log('✅ All PostgreSQL Database tables created/verified successfully');
      resolve();
    } catch (err) {
      console.error('❌ Error creating tables:', err.message);
      reject(err);
    }
  });
};

const getDb = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return pool;
};

const close = () => {
  return new Promise(async (resolve, reject) => {
    if (pool) {
      try {
        await pool.end();
        console.log('Database connection closed');
        resolve();
      } catch (err) {
        reject(err);
      }
    } else {
      resolve();
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};

const cron = require('node-cron');
const { getDb } = require('../config/database');
const { sendOTP } = require('../utils/mailer');

// Check for upcoming deadlines and send reminders
const checkDeadlines = async () => {
  try {
    const pool = getDb();
    
    // Get all active manual deadlines
    const { rows: manualDeadlines } = await pool.query(
      `SELECT d.*, u.email, u.name, 'manual' as source
       FROM deadlines d
       JOIN users u ON d.user_id = u.id
       WHERE d.is_completed = 0
       AND d.deadline_date >= CURRENT_DATE`
    );

    // Get all documents with expiry dates
    const { rows: autoDeadlines } = await pool.query(
      `SELECT d.id as doc_id, d.title, d.expiry_date as deadline_date, d.category, d.user_id, u.email, u.name, 'auto' as source
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.expiry_date IS NOT NULL AND d.expiry_date >= CURRENT_DATE`
    );

    const allTargets = [...manualDeadlines, ...autoDeadlines];

    for (const target of allTargets) {
      const deadlineDate = new Date(target.deadline_date);
      const todayDate = new Date();
      const daysUntilDeadline = Math.ceil((deadlineDate - todayDate) / (1000 * 60 * 60 * 24));

      let shouldSend = false;

      if (target.source === 'manual') {
        if (daysUntilDeadline <= target.reminder_days && daysUntilDeadline >= 0) {
          const { rows: existing } = await pool.query(
            `SELECT * FROM reminders_sent WHERE deadline_id = $1 AND reminder_date = CURRENT_DATE`,
            [target.id]
          );
          if (existing.length === 0) shouldSend = true;
        }
      } else {
        // Auto system (30, 14, 7, 1 days prior to expiry)
        if ([30, 14, 7, 1].includes(daysUntilDeadline)) {
          // Check if we already notified this user about this exact doc today
          const { rows: existing } = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 AND type = 'reminder' AND created_at >= CURRENT_DATE 
             AND description LIKE $2`,
            [target.user_id, `%${target.title}%`]
          );
          if (existing.length === 0) shouldSend = true;
        }
      }

      if (shouldSend) {
          console.log(`\n🔔 REMINDER (${target.source}): ${target.title}`);
          console.log(`   User: ${target.name} (${target.email})`);
          console.log(`   Days remaining: ${daysUntilDeadline}\n`);

          if (target.source === 'manual') {
            await pool.query(
              `INSERT INTO reminders_sent (deadline_id, user_id, reminder_date) VALUES ($1, $2, CURRENT_DATE)`,
              [target.id, target.user_id]
            );
          }

          await pool.query(
            `INSERT INTO notifications (user_id, title, description, type) VALUES ($1, $2, $3, $4)`,
            [
              target.user_id,
              'Document Expiry Approaching',
              `${target.title} expires in ${daysUntilDeadline} days.`,
              'reminder'
            ]
          );
      }
    }
  } catch (error) {
    console.error('Error in reminder service:', error);
  }
};

const start = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running daily reminder check...');
    checkDeadlines();
  });

  // Also run immediately on startup
  console.log('⏰ Reminder service started');
  checkDeadlines();
};

module.exports = {
  start,
  checkDeadlines
};

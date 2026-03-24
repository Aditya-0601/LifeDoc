const cron = require('node-cron');
const { getDb } = require('../config/database');
const { sendOTP } = require('../utils/mailer');

// Check for upcoming deadlines and send reminders
const checkDeadlines = async () => {
  try {
    const pool = getDb();
    
    // Get all active deadlines
    const { rows: deadlines } = await pool.query(
      `SELECT d.*, u.email, u.name
       FROM deadlines d
       JOIN users u ON d.user_id = u.id
       WHERE d.is_completed = 0
       AND d.deadline_date >= CURRENT_DATE
       ORDER BY d.deadline_date ASC`
    );

    for (const deadline of deadlines) {
      const deadlineDate = new Date(deadline.deadline_date);
      const todayDate = new Date();
      const daysUntilDeadline = Math.ceil((deadlineDate - todayDate) / (1000 * 60 * 60 * 24));

      // Check if reminder should be sent
      if (daysUntilDeadline <= deadline.reminder_days && daysUntilDeadline >= 0) {
        // Check if reminder already sent for this deadline today
        const { rows: existingReminders } = await pool.query(
          `SELECT * FROM reminders_sent 
           WHERE deadline_id = $1 AND reminder_date = CURRENT_DATE`,
          [deadline.id]
        );

        if (existingReminders.length === 0) {
          // Log reminder (in production, this would send email/SMS)
          console.log(`\n🔔 REMINDER: ${deadline.title}`);
          console.log(`   User: ${deadline.name} (${deadline.email})`);
          console.log(`   Deadline: ${deadline.deadline_date}`);
          console.log(`   Days remaining: ${daysUntilDeadline}`);
          console.log(`   Category: ${deadline.category}\n`);

          // Record reminder sent
          await pool.query(
            `INSERT INTO reminders_sent (deadline_id, user_id, reminder_date)
             VALUES ($1, $2, CURRENT_DATE)`,
            [deadline.id, deadline.user_id]
          );
        }
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

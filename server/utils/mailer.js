const nodemailer = require('nodemailer');

// Defaults to console logging (ideal for local testing without SMTP details)
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback transponder that just logs to the terminal
  return {
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
        console.log("-----------------------------------------");
        console.log(`✉️ MOCK EMAIL SENT TO: ${mailOptions.to}`);
        console.log(`📝 SUBJECT: ${mailOptions.subject}`);
        console.log(`📄 CONTENT: \n${mailOptions.text}`);
        console.log("-----------------------------------------");
        console.log("To send real emails, add SMTP_HOST, SMTP_USER, SMTP_PASS to your .env");
        resolve({ messageId: 'mock-id-123', response: 'Logged to console' });
      });
    }
  };
};

const transporter = createTransporter();

const sendOTP = async (to, otp) => {
  const mailOptions = {
    from: '"LifeDoc 🛡️" <noreply@lifedoc.app>',
    to,
    subject: 'Your LifeDoc Security Code',
    text: `Your LifeDoc login code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share this with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2b6cb0;">LifeDoc Security Verification</h2>
        <p>You requested to log in. Please use the following One-Time Password (OTP) to complete the process:</p>
        <div style="background-color: #f7fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; color: #1a202c; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendOTP
};

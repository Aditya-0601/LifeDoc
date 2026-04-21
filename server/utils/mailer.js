const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTP = async (to, otp) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('Sending OTP to:', to);

  try {
    // Dev-friendly fallback: always show OTP in terminal.
    if (!isProduction) {
      console.log(`[DEV OTP] ${to}: ${otp}`);
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER/EMAIL_PASS not configured. Using terminal OTP fallback.');
      return { accepted: [to], response: 'OTP logged to terminal' };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Login OTP',
      text: `Your OTP is ${otp}`
    });

    return info;
  } catch (error) {
    console.error('Mail error:', error.message);
    console.log(`[OTP FALLBACK] ${to}: ${otp}`);
    return { accepted: [to], response: 'Email failed, OTP logged to terminal' };
  }
};

module.exports = {
  sendOTP
};

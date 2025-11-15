// utils/sendEmail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT), // 587
      secure: false,                       // Gmail 587 → secure: false
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,      // Gmail App Password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📨 Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

module.exports = sendEmail;

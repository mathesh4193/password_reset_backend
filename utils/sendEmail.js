const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text, html }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail service directly
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });

  return info;
}

module.exports = sendEmail;

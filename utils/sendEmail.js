require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT), // 2525
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    const info = await transporter.sendMail({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📨 Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;

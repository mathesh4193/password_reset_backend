require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // use secure for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    // Verify connection configuration before attempting to send
    await transporter.verify();

    const fromName = process.env.FROM_NAME || "Password Reset";
    const fromEmail = process.env.FROM_EMAIL || "no-reply@example.com";

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(" Email sent:", info.messageId);
  } catch (err) {
    console.error(" Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;

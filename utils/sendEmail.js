const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = port === 465; // true for 465, false for 587
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // If you use self-signed certs in dev, you might add:
      // tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent:", info && (info.messageId || info.response));
    return info;
  } catch (error) {
    console.error("Email error:", error);
    // Do not throw in production unless you want to bubble up; return an error object
    throw error;
  }
};

module.exports = sendEmail;

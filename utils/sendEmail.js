require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const isGmail = (process.env.SMTP_SERVICE || "").toLowerCase() === "gmail";

    const transportOptions = isGmail
      ? {
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS, // for Gmail use an App Password
          },
        }
      : {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          requireTLS: true,
          tls: { ciphers: "TLSv1.2", rejectUnauthorized: false },
        };

    const transporter = nodemailer.createTransport(transportOptions);

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

    // If using ethereal or mailtrap, nodemailer can provide a preview URL
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(" Preview URL:", preview);
    }
  } catch (err) {
    console.error(" Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;

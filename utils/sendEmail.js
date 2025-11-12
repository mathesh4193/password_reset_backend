// utils/sendEmail.js
require('dotenv').config();

/**
 * Mock email sender for hosted environments (no real SMTP).
 * Logs the reset link to console instead of sending email.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  console.log("📧 [Mock Email] Sending to:", to);
  console.log("Subject:", subject);
  console.log("Text:", text);
  console.log("HTML:", html);
  console.log("✅ (No actual email sent — mock mode active)");
  return Promise.resolve(); // Simulate async success
};

module.exports = sendEmail;

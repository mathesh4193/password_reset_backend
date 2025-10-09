const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Hash helper
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/* ----------------------- REGISTER ----------------------- */
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ message: 'All fields required' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    await User.create({ email: email.toLowerCase(), password: hashed });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------- LOGIN ----------------------- */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* -------------------- FORGOT PASSWORD -------------------- */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(200).json({ message: 'If that email exists, you will receive a reset link.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    const expiry = Date.now() + (process.env.RESET_TOKEN_EXPIRY_MINUTES || 60) * 60000;

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = expiry;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    console.log("Reset URL:", resetUrl); // debug log

    const subject = 'Reset your password';
    const html = `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
      <p>This link expires in ${process.env.RESET_TOKEN_EXPIRY_MINUTES || 60} minutes.</p>
    `;

    await sendEmail({ to: user.email, subject, text: resetUrl, html });

    res.status(200).json({ message: 'If that email exists, you will receive a reset link.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* -------------------- VALIDATE TOKEN -------------------- */
router.get('/validate-reset-token', async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email)
      return res.status(400).json({ valid: false, message: 'Missing token or email.' });

    const hashed = hashToken(token);
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ valid: false, message: 'Invalid or expired token.' });

    res.json({ valid: true, message: 'Token valid' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

/* -------------------- RESET PASSWORD -------------------- */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res.status(400).json({ message: 'Missing fields' });

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      text: 'Your password has been updated successfully.',
      html: '<p>Your password has been updated successfully.</p>'
    });

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

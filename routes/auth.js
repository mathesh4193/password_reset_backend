require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Hash token
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');


router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ message: 'All fields required' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 12);

    await User.create({ email: email.toLowerCase(), password: hashed });

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Do not reveal whether user exists
    if (!user)
      return res.status(200).json({
        message: 'If that email exists, you will receive a reset link.',
      });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = undefined; // No expiry
    await user.save();

    const clientUrls = (process.env.CLIENT_URL || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const base = clientUrls[0].replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: resetUrl,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset password.</p>`,
    });

    res.json({
      message: 'If that email exists, you will receive a reset link.',
    });
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/validate-reset-token', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email)
      return res.status(400).json({ valid: false });

    const hashed = hashToken(token);

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashed,
    });

    if (!user) return res.status(400).json({ valid: false });

    res.json({ valid: true });
  } catch (err) {
    console.error('VALIDATE TOKEN ERROR:', err);
    res.status(500).json({ valid: false });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword)
      return res.status(400).json({ message: 'Missing fields' });

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid token' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      text: 'Your password has been updated.',
      html: '<p>Your password has been updated.</p>',
    });

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

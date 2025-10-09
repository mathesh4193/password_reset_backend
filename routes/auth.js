const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Helper to hash token (store hashed token in DB)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password ,confirmPassword} = req.body;
    
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Email, password, and confirm password are required' });
    }
    
    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword
    });
    
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Login failed. Please check your credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Login failed. Please check your credentials.' });
    }

    // If you want to issue JWT, you can uncomment below lines after installing jsonwebtoken and setting JWT_SECRET.
    // const jwt = require('jsonwebtoken');
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // return res.json({ token, message: 'Login successful.' });

    return res.json({ message: 'Login successful.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security it's often better to return the same response whether user exists or not.
      return res.status(200).json({ message: 'If that email exists you will receive a reset link.' });
    }

    // Create token and expiry
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashed = hashToken(rawToken);
    const expiryMinutes = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '60', 10);
    const expiryDate = Date.now() + expiryMinutes * 60 * 1000;

    // Save hashed token and expiry
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = expiryDate;
    await user.save();

    // Build reset link (frontend will have a route to consume token)
    const clientUrl = process.env.CLIENT_URL || 'https://passwordresetg.netlify.app';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Send email
    const subject = 'Reset your password';
    const text = `You requested a password reset. Click the link to reset your password: ${resetUrl}`;
    const html = `<p>You requested a password reset.</p>
                  <p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in ${expiryMinutes} minutes.</p>`;

    await sendEmail({ to: user.email, subject, text, html });

    return res.status(200).json({ message: 'If that email exists you will receive a reset link.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/validate-reset-token?token=...&email=...
router.get('/validate-reset-token', async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ valid: false, message: 'Missing token or email.' });

    const hashed = hashToken(token);
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ valid: false, message: 'Invalid or expired token.' });

    return res.json({ valid: true, message: 'Token is valid.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password
// body: { email, token, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ message: 'Missing required fields.' });

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    // Hash new password and update
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Optional: email confirmation
    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      text: 'Your password has been changed successfully. If you did not do this, contact support.',
      html: '<p>Your password has been changed successfully. If you did not do this, contact support immediately.</p>'
    });

    return res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// HASH TOKEN
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 12);
    await User.create({ email: email.toLowerCase(), password: hashed });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user)
      return res.json({
        message: "If that email exists, you will receive a reset link.",
      });

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    await user.save();

    const clientBase =
      process.env.CLIENT_URL.split(",")[1] ||
      "http://localhost:3001";

    const resetUrl = `${clientBase}/reset-password?token=${rawToken}&email=${user.email}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      text: resetUrl,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });

    res.json({
      message: "If that email exists, you will receive a reset link.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashToken(token),
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

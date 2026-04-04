import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'hireswift_secret', { expiresIn: '7d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, personalData } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'student', personalData: personalData || {} });
    // Send welcome email
    sendWelcomeEmail(email, name).catch(() => {});
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout
router.post('/logout', protect, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

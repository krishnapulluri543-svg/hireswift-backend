import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// Get my jobs
router.get('/jobs', protect, authorize('student'), async (req, res) => {
  try {
    const jobs = await Job.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get my profile
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update my profile
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const { personalData, name } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { personalData, name }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get job stats
router.get('/stats', protect, authorize('student'), async (req, res) => {
  try {
    const jobs = await Job.find({ email: req.user.email });
    res.json({
      success: true,
      stats: {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        applied: jobs.filter(j => j.status === 'applied').length,
        interview: jobs.filter(j => j.status === 'interview').length,
        offer: jobs.filter(j => j.status === 'offer').length,
        rejected: jobs.filter(j => j.status === 'rejected').length,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

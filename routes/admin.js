import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// Get stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalAgents, totalJobs, appliedJobs, interviews] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'agent' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'applied' }),
      Job.countDocuments({ status: 'interview' }),
    ]);
    res.json({ success: true, stats: { totalStudents, totalAgents, totalJobs, appliedJobs, interviews } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get all users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Create user
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password, role: role || 'student' });
    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Delete user
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Assign agent to student
router.post('/assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentEmail, agentEmail, priority } = req.body;
    const [student, agent] = await Promise.all([
      User.findOne({ email: studentEmail, role: 'student' }),
      User.findOne({ email: agentEmail, role: 'agent' })
    ]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    await User.findByIdAndUpdate(student._id, { assignedAgent: agent._id, priority: priority || 'Normal' });
    res.json({ success: true, message: `${studentEmail} assigned to ${agentEmail}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get all jobs
router.get('/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, jobs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Add job manually
router.post('/jobs', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { studentEmail, jobLink, jobDescription, jobTitle, company } = req.body;
    if (!studentEmail || !jobLink) return res.status(400).json({ success: false, message: 'studentEmail and jobLink required' });
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const job = await Job.create({ email: studentEmail, jobLink, jobDescription, jobTitle, company, status: 'pending', source: 'Manual' });
    res.status(201).json({ success: true, job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update job status
router.put('/jobs/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

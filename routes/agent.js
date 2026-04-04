import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import { sendJobAppliedEmail } from '../services/emailService.js';
import { tailorResume } from '../services/resumeTailor.js';

const router = express.Router();

// Get assigned students
router.get('/students', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student', assignedAgent: req.user._id }).select('-password');
    const studentsWithCounts = await Promise.all(students.map(async (s) => {
      const pendingJobs = await Job.countDocuments({ email: s.email, status: 'pending' });
      return { ...s.toObject(), pendingJobs };
    }));
    res.json({ success: true, students: studentsWithCounts, totalApplied: req.user.totalApplied, appliedToday: req.user.appliedToday });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get next job for a student
router.get('/queue', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const job = await Job.findOne({ email, status: 'pending' }).sort({ matchScore: -1, createdAt: 1 });
    res.json({ success: true, job: job || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Mark job as applied
router.post('/mark-applied', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const { job_id, email } = req.query;
    if (!job_id || !email) return res.status(400).json({ success: false, message: 'job_id and email required' });
    const job = await Job.findByIdAndUpdate(job_id, { status: 'applied', appliedAt: new Date(), appliedBy: req.user.email }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    // Update agent stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalApplied: 1, appliedToday: 1 } });
    // Send email notification
    const student = await User.findOne({ email });
    if (student) sendJobAppliedEmail(email, student.name, job.jobTitle, job.company, job.jobLink).catch(() => {});
    res.json({ success: true, message: 'Job marked as applied', job });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get student info
router.get('/student-info', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const { email } = req.query;
    const student = await User.findOne({ email }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, studentInfo: student });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get resume for a student
router.get('/resume', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const { email } = req.query;
    const student = await User.findOne({ email });
    if (!student || !student.resumeUrl) return res.status(404).json({ success: false, message: 'No resume found' });
    res.json({ success: true, resumeUrl: student.resumeUrl });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get AI tailored resume for a job
router.post('/tailor-resume', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const { jobId, email } = req.body;
    const [job, student] = await Promise.all([Job.findById(jobId), User.findOne({ email })]);
    if (!job || !student) return res.status(404).json({ success: false, message: 'Job or student not found' });
    const result = await tailorResume(student, job.jobDescription, job.jobTitle);
    if (result.success) await Job.findByIdAndUpdate(jobId, { tailoredResume: result.tailoredResume });
    res.json({ success: true, tailoredResume: result.tailoredResume });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

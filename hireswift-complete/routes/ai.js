import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import { tailorResume, generateCoverLetter, answerJobQuestion } from '../services/resumeTailor.js';

const router = express.Router();

// Generate AI answer to job question
router.post('/generate-answer', protect, async (req, res) => {
  try {
    const { question, jobId, email, jobDescription } = req.body;
    const student = await User.findOne({ email: email || req.user.email });
    const jobDesc = jobDescription || (jobId ? (await Job.findById(jobId))?.jobDescription : '');
    const result = await answerJobQuestion(question, student?.personalData || {}, jobDesc);
    res.json({ success: true, answer: result.answer });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Generate cover letter
router.post('/generate-cover-letter', protect, async (req, res) => {
  try {
    const { jobId, email, jobDescription, jobTitle, company } = req.body;
    const student = await User.findOne({ email: email || req.user.email });
    const job = jobId ? await Job.findById(jobId) : null;
    const result = await generateCoverLetter(student || {}, jobDescription || job?.jobDescription || '', jobTitle || job?.jobTitle || '', company || job?.company || '');
    if (jobId && result.coverLetter) await Job.findByIdAndUpdate(jobId, { coverLetter: result.coverLetter });
    res.json({ success: true, coverLetter: result.coverLetter });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Tailor resume for a job
router.post('/improve-resume', protect, async (req, res) => {
  try {
    const { jobId, email, jobDescription, jobTitle } = req.body;
    const student = await User.findOne({ email: email || req.user.email });
    const job = jobId ? await Job.findById(jobId) : null;
    const result = await tailorResume(student || {}, jobDescription || job?.jobDescription || '', jobTitle || job?.jobTitle || '');
    if (jobId && result.tailoredResume) await Job.findByIdAndUpdate(jobId, { tailoredResume: result.tailoredResume });
    res.json({ success: true, improvedResume: result.tailoredResume });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { scrapeJobsForStudent, calculateMatchScore } from '../services/jobScraper.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// Scrape jobs for one student
router.post('/scrape/:email', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const student = await User.findOne({ email: req.params.email, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const pd = typeof student.personalData === 'string' ? JSON.parse(student.personalData || '{}') : (student.personalData || {});
    const jobs = await scrapeJobsForStudent(pd);
    let added = 0;
    for (const job of jobs) {
      const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
      if (!exists) {
        await Job.create({ email: student.email, jobLink: job.jobLink, jobTitle: job.title, company: job.company, jobDescription: job.jobDescription, source: job.source, matchScore: calculateMatchScore(job, pd), status: 'pending' });
        added++;
      }
    }
    res.json({ success: true, message: `Found ${jobs.length} jobs, added ${added} new`, added });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Scrape for all students
router.post('/scrape-all', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    const results = [];
    for (const student of students) {
      const pd = typeof student.personalData === 'string' ? JSON.parse(student.personalData || '{}') : (student.personalData || {});
      const jobs = await scrapeJobsForStudent(pd);
      let added = 0;
      for (const job of jobs) {
        const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
        if (!exists) {
          await Job.create({ email: student.email, jobLink: job.jobLink, jobTitle: job.title, company: job.company, jobDescription: job.jobDescription, source: job.source, matchScore: calculateMatchScore(job, pd), status: 'pending' });
          added++;
        }
      }
      results.push({ email: student.email, added });
    }
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Auto-scraper scheduler
export function startAutoScraper() {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  async function run() {
    try {
      console.log('🔍 Auto-scraper running...');
      const students = await User.find({ role: 'student' });
      for (const student of students) {
        try {
          const pd = typeof student.personalData === 'string' ? JSON.parse(student.personalData || '{}') : (student.personalData || {});
          if (!pd.targetedJobs && !pd.skills) continue;
          const jobs = await scrapeJobsForStudent(pd);
          let added = 0;
          for (const job of jobs) {
            const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
            if (!exists) {
              await Job.create({ email: student.email, jobLink: job.jobLink, jobTitle: job.title, company: job.company, jobDescription: job.jobDescription, source: job.source, matchScore: calculateMatchScore(job, pd), status: 'pending' });
              added++;
            }
          }
          if (added > 0) console.log(`✅ Added ${added} jobs for ${student.email}`);
        } catch (e) {
          console.error(`❌ Scraper error for ${student.email}:`, e.message);
        }
      }
      console.log(`🔍 Auto-scraper done. ${students.length} students processed.`);
    } catch (e) {
      console.error('Auto-scraper error:', e.message);
    }
  }
  setTimeout(run, 60000); // Run 1 min after startup
  setInterval(run, SIX_HOURS);
  console.log('🔍 Auto-scraper scheduled (every 6 hours)');
}

export default router;

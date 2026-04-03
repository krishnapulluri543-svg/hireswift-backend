// routes/scraper.js
// API routes for job scraping + auto-scheduler

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { scrapeJobsForStudent, calculateMatchScore } from '../services/jobScraper.js';
import { sendJobAppliedEmail, sendWelcomeEmail } from '../services/emailService.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// ─── Manually trigger scrape for one student ─────────────────────
router.post('/scrape/:email', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const student = await User.findOne({ email: req.params.email, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const personalData = typeof student.personalData === 'string'
      ? JSON.parse(student.personalData || '{}')
      : student.personalData || {};

    const jobs = await scrapeJobsForStudent(personalData);

    let added = 0;
    for (const job of jobs) {
      const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
      if (!exists) {
        const matchScore = calculateMatchScore(job, personalData);
        await Job.create({
          email: student.email,
          jobLink: job.jobLink,
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.jobDescription,
          source: job.source,
          matchScore,
          status: 'pending',
          timestamp: new Date()
        });
        added++;
      }
    }

    res.json({
      success: true,
      message: `Scraped ${jobs.length} jobs, added ${added} new ones for ${student.email}`,
      total: jobs.length,
      added
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Scrape jobs for ALL students ────────────────────────────────
router.post('/scrape-all', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    const results = [];

    for (const student of students) {
      const personalData = typeof student.personalData === 'string'
        ? JSON.parse(student.personalData || '{}')
        : student.personalData || {};

      const jobs = await scrapeJobsForStudent(personalData);
      let added = 0;

      for (const job of jobs) {
        const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
        if (!exists) {
          const matchScore = calculateMatchScore(job, personalData);
          await Job.create({
            email: student.email,
            jobLink: job.jobLink,
            jobTitle: job.title,
            company: job.company,
            jobDescription: job.jobDescription,
            source: job.source,
            matchScore,
            status: 'pending',
            timestamp: new Date()
          });
          added++;
        }
      }
      results.push({ email: student.email, found: jobs.length, added });
    }

    res.json({ success: true, results, totalStudents: students.length });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Send welcome email ───────────────────────────────────────────
router.post('/welcome-email/:email', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ email: req.params.email });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const result = await sendWelcomeEmail(student.email, student.name);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Auto-scraper scheduler (runs every 6 hours) ──────────────────
export function startAutoScraper(app) {
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  async function runScraper() {
    try {
      console.log('🔍 Auto-scraper: Starting job scan for all students...');
      const students = await User.find({ role: 'student' });

      for (const student of students) {
        try {
          const personalData = typeof student.personalData === 'string'
            ? JSON.parse(student.personalData || '{}')
            : student.personalData || {};

          const jobs = await scrapeJobsForStudent(personalData);
          let added = 0;

          for (const job of jobs) {
            const exists = await Job.findOne({ email: student.email, jobLink: job.jobLink });
            if (!exists) {
              const matchScore = calculateMatchScore(job, personalData);
              await Job.create({
                email: student.email,
                jobLink: job.jobLink,
                jobTitle: job.title,
                company: job.company,
                jobDescription: job.jobDescription,
                source: job.source,
                matchScore,
                status: 'pending',
                timestamp: new Date()
              });
              added++;
            }
          }

          if (added > 0) {
            console.log(`✅ Added ${added} new jobs for ${student.email}`);
          }
        } catch (e) {
          console.error(`❌ Scraper error for ${student.email}:`, e.message);
        }
      }

      console.log(`🔍 Auto-scraper: Done. Processed ${students.length} students.`);
    } catch (e) {
      console.error('Auto-scraper error:', e.message);
    }
  }

  // Run immediately on startup, then every 6 hours
  setTimeout(runScraper, 30000); // 30 seconds after startup
  setInterval(runScraper, SIX_HOURS);
  console.log('🔍 Auto-scraper scheduler started (every 6 hours)');
}

export default router;

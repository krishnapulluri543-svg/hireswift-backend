const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('agent', 'admin'));

router.get('/queue', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { agent: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('student', 'name email profile.phone resume')
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/students', async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', assignedAgent: req.user._id }).select(
      'name email profile resume createdAt'
    );
    res.status(200).json({ success: true, total: students.length, data: students });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:id', async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student', assignedAgent: req.user._id }).select(
      '-password'
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:id/resume', async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, assignedAgent: req.user._id });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
    }

    if (!student.resume || !student.resume.path) {
      return res.status(404).json({ success: false, message: 'Student has no resume uploaded' });
    }

    if (!fs.existsSync(student.resume.path)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on server' });
    }

    res.download(student.resume.path, student.resume.originalName);
  } catch (error) {
    next(error);
  }
});

router.get('/students/:id/jobs', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { student: req.params.id, agent: req.user._id };
    if (status) filter.status = status;

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, total: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
});

router.put('/jobs/:id/status', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'applied', 'rejected', 'interview', 'offer', 'withdrawn'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const update = { status, notes };
    if (status === 'applied') update.appliedAt = new Date();
    if (status === 'rejected') update.rejectedAt = new Date();

    const job = await Job.findOneAndUpdate({ _id: req.params.id, agent: req.user._id }, update, { new: true }).populate(
      'student',
      'name email'
    );

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found in your queue' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

router.post('/jobs/:id/assign', async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { agent: req.user._id },
      { new: true }
    ).populate('student', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.status(200).json({ success: true, message: 'Job assigned to you', data: job });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [jobStats, studentCount] = await Promise.all([
      Job.aggregate([
        { $match: { agent: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: 'student', assignedAgent: req.user._id }),
    ]);

    const summary = { total: 0, pending: 0, applied: 0, rejected: 0, interview: 0, offer: 0 };
    jobStats.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });

    res.status(200).json({
      success: true,
      data: { jobs: summary, assignedStudents: studentCount },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

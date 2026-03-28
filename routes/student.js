const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('student'));

router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedAgent', 'name email');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const allowedFields = ['name', 'profile'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/resume/upload', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        resume: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: user.resume,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/resume/download', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.resume || !user.resume.path) {
      return res.status(404).json({ success: false, message: 'No resume found' });
    }

    const filePath = user.resume.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on server' });
    }

    res.download(filePath, user.resume.originalName);
  } catch (error) {
    next(error);
  }
});

router.get('/jobs', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { student: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('agent', 'name email')
        .sort({ createdAt: -1 })
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

router.post('/jobs', async (req, res, next) => {
  try {
    const { title, company, location, jobUrl, description, requirements, jobType, priority } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: 'Title and company are required' });
    }

    const job = await Job.create({
      title,
      company,
      location,
      jobUrl,
      description,
      requirements,
      jobType,
      priority,
      student: req.user._id,
      source: 'extension',
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, student: req.user._id }).populate('agent', 'name email');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
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

    const job = await Job.findOneAndUpdate({ _id: req.params.id, student: req.user._id }, update, { new: true });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, student: req.user._id });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/stats/summary', async (req, res, next) => {
  try {
    const stats = await Job.aggregate([
      { $match: { student: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary = { total: 0, pending: 0, applied: 0, rejected: 0, interview: 0, offer: 0, withdrawn: 0 };
    stats.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

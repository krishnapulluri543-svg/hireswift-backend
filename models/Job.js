const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    jobUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    requirements: [String],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      default: 'full-time',
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'rejected', 'interview', 'offer', 'withdrawn'],
      default: 'pending',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appliedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    interviewDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    aiAnswers: [
      {
        question: String,
        answer: String,
        generatedAt: { type: Date, default: Date.now },
      },
    ],
    source: {
      type: String,
      enum: ['manual', 'extension', 'agent'],
      default: 'extension',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

jobSchema.index({ student: 1, status: 1 });
jobSchema.index({ agent: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);

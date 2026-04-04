import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  jobLink: { type: String, required: true },
  jobTitle: String,
  company: String,
  jobDescription: String,
  source: { type: String, default: 'Manual' },
  status: { type: String, enum: ['pending', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'], default: 'pending' },
  matchScore: { type: Number, default: 0 },
  jobNumber: Number,
  resumePath: String,
  tailoredResume: String,
  coverLetter: String,
  appliedAt: Date,
  appliedBy: String,
  notes: String,
}, { timestamps: true });

// Auto-increment job number per student
jobSchema.pre('save', async function(next) {
  if (this.isNew && !this.jobNumber) {
    const count = await mongoose.model('Job').countDocuments({ email: this.email });
    this.jobNumber = count + 1;
  }
  next();
});

export default mongoose.model('Job', jobSchema);

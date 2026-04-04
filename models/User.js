import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['student', 'agent', 'admin'], default: 'student' },
  googleId: String,
  avatar: String,
  // Student fields
  personalData: { type: mongoose.Schema.Types.Mixed },
  resumeUrl: String,
  resumePath: String,
  priority: { type: String, enum: ['High', 'Normal', 'Low'], default: 'Normal' },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Agent fields
  totalApplied: { type: Number, default: 0 },
  appliedToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

export default mongoose.model('User', userSchema);

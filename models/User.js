const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'agent', 'student'],
      default: 'student',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
      bio: String,
      skills: [String],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          startYear: Number,
          endYear: Number,
        },
      ],
      experience: [
        {
          company: String,
          title: String,
          startDate: Date,
          endDate: Date,
          description: String,
        },
      ],
    },
    resume: {
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: Date,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

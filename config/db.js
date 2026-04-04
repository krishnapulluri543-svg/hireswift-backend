import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set. Database features unavailable.');
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

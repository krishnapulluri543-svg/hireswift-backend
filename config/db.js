const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI secret is not set. Database features will be unavailable.');
    console.warn('    Add your MongoDB Atlas connection string as the MONGODB_URI secret to enable full functionality.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('   The server will continue running but database features will be unavailable.');
  }
};

module.exports = connectDB;

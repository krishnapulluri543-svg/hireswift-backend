require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const path = require('path');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

connectDB();

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

configurePassport();
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HireSwift API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      student: '/api/student',
      agent: '/api/agent',
      admin: '/api/admin',
      ai: '/api/ai',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const https = require('https');

const selfPing = () => {
  const url = process.env.APP_URL || 'https://workspace.krishnapulluri5.replit.app/health';
  https.get(url, (res) => {
    console.log(`[Self-ping] ${new Date().toISOString()} — status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.warn(`[Self-ping] Failed: ${err.message}`);
  });
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HireSwift API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  setInterval(selfPing, 3 * 60 * 1000);
  console.log('Self-ping active — pinging /health every 3 minutes');
});

module.exports = app;

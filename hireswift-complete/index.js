import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import agentRoutes from './routes/agent.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import scraperRoutes, { startAutoScraper } from './routes/scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (req, res) => res.json({ success: true, message: 'HireSwift API is running', version: '2.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/scraper', scraperRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// Connect DB and start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`HireSwift API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Self-ping to stay awake
    const url = process.env.APP_URL || `http://localhost:${PORT}`;
    setInterval(() => {
      import('axios').then(({ default: axios }) => {
        axios.get(`${url}/health`).catch(() => {});
      });
    }, 3 * 60 * 1000);
    console.log('Self-ping active — pinging /health every 3 minutes');
    // Start auto job scraper
    startAutoScraper();
  });
});

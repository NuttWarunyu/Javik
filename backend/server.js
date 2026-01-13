// Express server for TikTok Automation API
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Ensure output directories exist
async function ensureDirectories() {
  const dirs = [
    path.join(__dirname, '../output/videos'),
    path.join(__dirname, '../output/captions'),
    path.join(__dirname, '../output/temp'),
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists or permission error
      console.warn(`Warning: Could not create directory ${dir}:`, error.message);
    }
  }
}

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (videos, images)
app.use('/api/video/download', express.static(path.join(__dirname, '../output/videos')));
app.use('/api/video/download/draft', express.static(path.join(__dirname, '../output/draft')));
app.use('/api/video/download/no_voice', express.static(path.join(__dirname, '../output/no_voice')));
app.use('/api/video/download/scripts', express.static(path.join(__dirname, '../output/scripts')));
app.use('/api/static', express.static(path.join(__dirname, '../output')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TikTok Automation API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Video routes
const videoRoutes = require('./routes/videoRoutes');
app.use('/api/video', videoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Initialize server
async function startServer() {
  await ensureDirectories();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 TikTok Automation API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;



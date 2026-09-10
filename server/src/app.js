const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const healthRoute = require('./routes/healthRoute');

const app = express();

// --------------- Security middleware ---------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// --------------- Rate limiting (auth endpoints) ---------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// --------------- Body parsing ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Request logging ---------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --------------- Routes ---------------
app.use('/api/health', healthRoute);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/providers', require('./routes/providerRoutes'));

// Admin routes will be mounted here in Phase 6+
app.use('/api/admin', require('./routes/adminRoutes'));
// --------------- 404 handler ---------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// --------------- Centralized error handler ---------------
app.use(errorHandler);

module.exports = app;

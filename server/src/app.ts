import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import approvalsRoutes from './routes/approvals.js';
import webhooksRoutes from './routes/webhooks.js';
import logsRoutes from './routes/logs.js';
import settingsRoutes from './routes/settings.js';
import assistantRoutes from './routes/assistant.js';

import cookieParser from 'cookie-parser';

export const app = express();

// Disable technology disclosure header
app.disable('x-powered-by');

// Enterprise HTTP Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching CLIENT_URL
      if (!origin || origin === env.CLIENT_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (exempt from rate limits)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    timezone: env.DEFAULT_TIMEZONE,
  });
});

// Apply API rate limiter to all standard endpoints
app.use('/api/', apiLimiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/assistant', assistantRoutes);

// Global Error Handler
app.use(errorHandler);

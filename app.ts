import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { httpLogger, requestId } from './middleware/logging.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';

export function createApp(): express.Application {
  const app = express();

  // ── Security Headers (Helmet) ──────────────────────
  // Sets: X-DNS-Prefetch-Control, X-Frame-Options, X-Content-Type-Options,
  //       Referrer-Policy, HSTS, X-XSS-Protection, CSP (basic)
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (config.cors.origins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: ${origin} not allowed`));
        }
      },
      credentials: true, // Required for cookies
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );

  // ── Global Rate Limit ─────────────────────────────
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs, // 15 minutes
      max: config.rateLimit.max,           // 100 req/window
      standardHeaders: true,               // Return RateLimit-* headers
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
      },
    }),
  );

  // ── Body Parsing + Compression ────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(config.cookie.secret));
  app.use(compression());

  // ── Request ID + HTTP Logger ──────────────────────
  app.use(requestId);
  app.use(httpLogger);

  // ── Health Endpoint ───────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      env: config.app.env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '0.0.0',
    });
  });

  // ── API Routes ────────────────────────────────────
  const api = express.Router();
  api.use('/auth', authRoutes);
  api.use('/posts', postRoutes);
  app.use(config.app.apiPrefix, api);

  // ── 404 + Error Handlers ──────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

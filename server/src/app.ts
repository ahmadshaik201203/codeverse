import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { getDbStatus, isDbConnected } from './config/db';
import authRoutes from './routes/auth.routes';
import domainRoutes from './routes/domain.routes';
import projectRoutes from './routes/project.routes';
import aiRoutes from './routes/ai.routes';
import mentorRoutes from './routes/mentor.routes';
import evaluatorRoutes from './routes/evaluator.routes';
import portfolioRoutes from './routes/portfolio.routes';
import gamificationRoutes from './routes/gamification.routes';
import analyticsRoutes from './routes/analytics.routes';
import communityRoutes from './routes/community.routes';
import adminRoutes from './routes/admin.routes';
import { requestId, requestLog } from './middleware/requestLog';
import { securityHeaders } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error';

/**
 * Builds the Express application without binding a port or opening a database
 * connection. `src/index.ts` owns the process concerns; tests import this so a
 * suite can mount the real routes against an isolated database.
 */
export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  if (env.trustProxy > 0) {
    app.set('trust proxy', env.trustProxy);
  }

  app.use(requestId());
  app.use(securityHeaders());

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header: same-origin, curl or server-to-server.
        if (!origin) return callback(null, true);
        return callback(null, env.corsOrigins.includes(origin));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Request-Id', 'Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      credentials: false,
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(requestLog());

  // Main Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/domains', domainRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api/evaluator', evaluatorRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (_req, res) => {
    const connected = isDbConnected();

    res.status(connected ? 200 : 503).json({
      status: connected ? 'ok' : 'degraded',
      database: getDbStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

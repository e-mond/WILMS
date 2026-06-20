import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from '../config/env.js';
import { errorHandler } from './error-handler.js';
import { optionalAuth } from '../middleware/authenticate.js';
import { auditRouter } from '../modules/audit/routes.js';
import { authRouter } from '../modules/auth/routes.js';
import { borrowersRouter } from '../modules/borrowers/routes.js';
import { groupFormationRouter } from '../modules/group-formation/routes.js';
import { healthRouter } from '../modules/health/routes.js';
import { loansRouter } from '../modules/loans/routes.js';
import { loanPoolsRouter } from '../modules/loan-pools/routes.js';
import { paymentsRouter } from '../modules/payments/routes.js';
import { reportsRouter } from '../modules/reports/routes.js';
import { uploadsRouter } from '../modules/uploads/routes.js';

function mountBusinessRoutes(app: express.Application, basePath = '') {
  const prefix = basePath.replace(/\/$/, '');
  app.use(`${prefix}`, loansRouter);
  app.use(`${prefix}`, loanPoolsRouter);
  app.use(`${prefix}`, paymentsRouter);
  app.use(`${prefix}`, borrowersRouter);
  app.use(`${prefix}`, groupFormationRouter);
  app.use(`${prefix}`, auditRouter);
  app.use(`${prefix}`, reportsRouter);
  app.use(`${prefix}`, uploadsRouter);
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());
  app.use(optionalAuth);

  app.use(healthRouter);
  app.use(authRouter);

  mountBusinessRoutes(app, '/api/v1');
  mountBusinessRoutes(app, '');

  app.use(errorHandler);

  return app;
}

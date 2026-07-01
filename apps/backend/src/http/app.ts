import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { errorHandler } from './error-handler.js';
import { optionalAuth } from '../middleware/authenticate.js';
import { auditRouter } from '../modules/audit/routes.js';
import { authRouter } from '../modules/auth/routes.js';
import { borrowersRouter } from '../modules/borrowers/routes.js';
import { collectorsRouter } from '../modules/collectors/routes.js';
import { groupFormationRouter } from '../modules/group-formation/routes.js';
import { healthRouter } from '../modules/health/routes.js';
import { loansRouter } from '../modules/loans/routes.js';
import { notificationsRouter } from '../modules/notifications/routes.js';
import { adjustmentsRouter } from '../modules/adjustments/routes.js';
import { loanPoolsRouter } from '../modules/loan-pools/routes.js';
import { paymentsRouter } from '../modules/payments/routes.js';
import { reconciliationRouter } from '../modules/reconciliation/routes.js';
import { reportsRouter } from '../modules/reports/routes.js';
import { settingsRouter } from '../modules/settings/routes.js';
import { syncRouter } from '../modules/sync/routes.js';
import { uploadsRouter } from '../modules/uploads/routes.js';
import { groupsRouter } from '../modules/groups/routes.js';
import { collectorPortalRouter } from '../modules/collector-portal/routes.js';
import { dashboardRouter } from '../modules/dashboard/routes.js';
import { expensesRouter } from '../modules/expenses/routes.js';
import { riskFlagsRouter } from '../modules/risk-flags/routes.js';
import { searchRouter } from '../modules/search/routes.js';
import { locationsRouter } from '../modules/locations/routes.js';
import { overpaymentReviewsRouter } from '../modules/overpayment-reviews/routes.js';
import { analyticsRouter } from '../modules/analytics/routes.js';
import { photoCaptureRouter } from '../modules/photo-capture/routes.js';
import { transactionsRouter } from '../modules/transactions/routes.js';
import { messagesRouter } from '../modules/messages/routes.js';

function mountBusinessRoutes(app: express.Application, basePath = '') {
  const prefix = basePath.replace(/\/$/, '');
  app.use(`${prefix}`, loansRouter);
  app.use(`${prefix}`, loanPoolsRouter);
  app.use(`${prefix}`, adjustmentsRouter);
  app.use(`${prefix}`, paymentsRouter);
  app.use(`${prefix}`, borrowersRouter);
  app.use(`${prefix}`, collectorsRouter);
  app.use(`${prefix}`, groupFormationRouter);
  app.use(`${prefix}`, auditRouter);
  app.use(`${prefix}`, reconciliationRouter);
  app.use(`${prefix}`, reportsRouter);
  app.use(`${prefix}`, settingsRouter);
  app.use(`${prefix}`, notificationsRouter);
  app.use(`${prefix}`, groupsRouter);
  app.use(`${prefix}`, collectorPortalRouter);
  app.use(`${prefix}`, dashboardRouter);
  app.use(`${prefix}`, expensesRouter);
  app.use(`${prefix}`, riskFlagsRouter);
  app.use(`${prefix}`, searchRouter);
  app.use(`${prefix}`, locationsRouter);
  app.use(`${prefix}`, overpaymentReviewsRouter);
  app.use(`${prefix}`, analyticsRouter);
  app.use(`${prefix}`, photoCaptureRouter);
  app.use(`${prefix}`, transactionsRouter);
  app.use(`${prefix}`, messagesRouter);
  app.use(`${prefix}`, syncRouter);
  app.use(`${prefix}`, uploadsRouter);
}

export function createApp() {
  const app = express();

  if (env.trustProxy) {
    app.set('trust proxy', env.trustProxyHops);
  }

  app.use(
    helmet({
      contentSecurityPolicy: env.nodeEnv === 'production',
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
      referrerPolicy: { policy: 'no-referrer' },
      hsts: env.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

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

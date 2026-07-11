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
import { communicationsRouter } from '../modules/communications/routes.js';
import { trackingRouter } from '../modules/tracking/routes.js';
import { webhooksRouter } from '../modules/webhooks/routes.js';
import { organizationHolidaysRouter } from '../modules/organization-holidays/routes.js';

function mountBusinessRoutes(app: express.Application, basePath = '') {
  const prefix = basePath.replace(/\/$/, '');

  // Public routes must mount before routers that apply blanket requireAuth middleware.
  // Otherwise Express invokes the first mounted router for every /api/v1 request and
  // unauthenticated mobile capture / location lookups receive 401 before matching.
  app.use(`${prefix}`, photoCaptureRouter);
  app.use(`${prefix}`, locationsRouter);

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
  app.use(`${prefix}`, overpaymentReviewsRouter);
  app.use(`${prefix}`, analyticsRouter);
  app.use(`${prefix}`, transactionsRouter);
  app.use(`${prefix}`, messagesRouter);
  app.use(`${prefix}`, communicationsRouter);
  app.use(`${prefix}`, syncRouter);
  app.use(`${prefix}`, uploadsRouter);
  app.use(`${prefix}`, organizationHolidaysRouter);
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
  app.use('/api/v1', healthRouter);
  app.use(trackingRouter);
  app.use(webhooksRouter);
  app.use(authRouter);

  app.use((req, _res, next) => {
    const path = req.path;
    if (
      path.startsWith('/api/v1') ||
      path === '/health' ||
      path.startsWith('/auth') ||
      path.startsWith('/tracking') ||
      path.startsWith('/webhooks')
    ) {
      next();
      return;
    }

    req.url = `/api/v1${req.url}`;
    next();
  });

  mountBusinessRoutes(app, '/api/v1');

  app.use(errorHandler);

  return app;
}

/**
 * Public surface for @wilms/domain — used by Next Route Handlers and the thin Express adapter.
 */
import './config/load-env.js';

export { createApp } from './http/app.js';
export { handleWilmsFetchRequest, getWilmsExpressApp } from './http/fetch-handler.js';
export { isDatabaseEnabled, getDb, getPool } from './db/client.js';
export { env } from './config/env.js';
export { isServerlessRuntime } from './config/runtime.js';
export { processPaymentNotificationJobs } from './modules/notifications/payment-scheduler.service.js';
export { processScheduledMessages } from './modules/communications/service.js';

/**
 * Ambient module types for @wilms/domain when consumed from the Next.js app.
 * Full domain type-check runs via `npm run type-check -w @wilms/domain`.
 */
declare module '@wilms/domain' {
  import type { Express } from 'express';

  export function createApp(): Express;
  export function getWilmsExpressApp(): Express;
  export function handleWilmsFetchRequest(
    request: Request,
    options: { expressPath: string },
  ): Promise<Response>;
  export function isDatabaseEnabled(): boolean;
  export function getDb(): unknown;
  export function getPool(): unknown;
  export const env: Record<string, unknown>;
  export function isServerlessRuntime(): boolean;
  export function processPaymentNotificationJobs(
    referenceDate?: string,
  ): Promise<unknown>;
  export function processScheduledMessages(): Promise<number>;
}

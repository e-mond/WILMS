/**
 * Types entry for consumers that should not deep-check domain sources
 * (e.g. Next.js app `tsc`). Runtime still resolves to src/index-exports.ts.
 */
export declare function createApp(): import('express').Express;
export declare function getWilmsExpressApp(): import('express').Express;
export declare function handleWilmsFetchRequest(
  request: Request,
  options: { expressPath: string },
): Promise<Response>;
export declare function isDatabaseEnabled(): boolean;
export declare function getDb(): unknown;
export declare function getPool(): unknown;
export declare const env: Record<string, unknown>;
export declare function isServerlessRuntime(): boolean;
export declare function processPaymentNotificationJobs(
  referenceDate?: string,
): Promise<unknown>;
export declare function processScheduledMessages(): Promise<number>;

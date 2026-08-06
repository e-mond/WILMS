import { apiClient } from '@/utils/apiClient';

export type OpsSurfaceState =
  | 'ok'
  | 'degraded'
  | 'unavailable'
  | 'external'
  | 'not_applicable';

export interface OpsSurface {
  id: string;
  label: string;
  state: OpsSurfaceState;
  detail: string;
}

export interface OpsStatusReport {
  generatedAt: string;
  deployment: {
    version: string;
    gitCommit: string | null;
    environment: string;
    nodeVersion: string;
    buildId: string | null;
    deployedAt: string | null;
  };
  surfaces: OpsSurface[];
  workers: {
    redis: 'not_used' | 'configured' | 'connected' | 'unavailable';
    queue: 'in_process' | 'bullmq' | 'disabled';
    scheduler: 'http_triggered';
    note: string;
    lastRuns?: {
      paymentNotifications: OpsWorkerLastRun | null;
      communications: OpsWorkerLastRun | null;
    };
  };
  financial: {
    availableCapitalPesewas: number;
    totalDisbursedPesewas: number;
    totalCollectedPesewas: number;
    outstandingPesewas: number;
    totalExpensesPesewas: number;
    netOperatingCashPesewas: number;
    collectionRatePercent: number;
    alerts: string[];
  } | null;
  databaseEnabled: boolean;
  backups: {
    status: 'external_managed';
    provider: 'neon';
    detail: string;
  };
  health: {
    status: 'ok' | 'degraded';
    degradedReasons: string[];
    uptimeSeconds: number;
  };
}

export interface OpsWorkerLastRun {
  kind: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  correlationId?: string;
  summary?: Record<string, unknown>;
  error?: string;
}

export const opsService = {
  getStatus(): Promise<OpsStatusReport> {
    return apiClient.get<OpsStatusReport>('/ops/status');
  },
};

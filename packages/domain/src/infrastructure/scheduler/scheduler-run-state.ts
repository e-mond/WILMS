/**
 * In-process last-run snapshot for payment/comms schedulers (ops visibility).
 * Process-local — not shared across instances without Redis.
 */
export interface SchedulerRunSnapshot {
  kind: 'payment_notifications' | 'communications';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  correlationId?: string;
  summary?: Record<string, unknown>;
  error?: string;
}

let lastPaymentRun: SchedulerRunSnapshot | null = null;
let lastCommunicationsRun: SchedulerRunSnapshot | null = null;

export function recordSchedulerRun(snapshot: SchedulerRunSnapshot): void {
  if (snapshot.kind === 'payment_notifications') {
    lastPaymentRun = snapshot;
  } else {
    lastCommunicationsRun = snapshot;
  }
}

export function getSchedulerLastRuns(): {
  paymentNotifications: SchedulerRunSnapshot | null;
  communications: SchedulerRunSnapshot | null;
} {
  return {
    paymentNotifications: lastPaymentRun,
    communications: lastCommunicationsRun,
  };
}

export function resetSchedulerLastRunsForTests(): void {
  lastPaymentRun = null;
  lastCommunicationsRun = null;
}

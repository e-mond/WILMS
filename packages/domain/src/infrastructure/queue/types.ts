export type QueueName = 'mail' | 'sms' | 'export' | 'scheduler' | 'outbox' | 'dlq';

export interface QueueJobEnvelope<T = Record<string, unknown>> {
  type: string;
  payload: T;
  correlationId?: string;
  createdAt: string;
  attempt?: number;
}

export interface QueueStats {
  mode: 'bullmq' | 'in_process' | 'disabled';
  redisConfigured: boolean;
  redisConnected: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

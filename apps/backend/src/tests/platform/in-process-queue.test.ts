import { describe, expect, it } from 'vitest';
import {
  enqueueInProcess,
  getInProcessQueueStats,
  registerInProcessHandler,
} from '../../infrastructure/queue/in-process-queue.js';

describe('in-process queue fallback', () => {
  it('executes registered handlers', async () => {
    let seen = '';
    registerInProcessHandler('test.echo', async (job) => {
      seen = String(job.payload.value ?? '');
    });

    const result = await enqueueInProcess('mail', {
      type: 'test.echo',
      payload: { value: 'ok' },
    });

    expect(result.mode).toBe('in_process');
    expect(seen).toBe('ok');
    expect(getInProcessQueueStats().completed).toBeGreaterThan(0);
  });
});

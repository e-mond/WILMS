import { MOCK_SERVICE_DELAY_MS } from '@/config/api';

export async function simulateDelay(ms = MOCK_SERVICE_DELAY_MS): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

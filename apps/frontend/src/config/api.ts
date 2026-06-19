import { isDemoMode } from '@/data-provider/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const API_TIMEOUT_MS = 10_000;

/** True when mock data providers are active (dev, staging without API, or forced demo). */
export const USE_MOCK_SERVICES = isDemoMode();

export const MOCK_SERVICE_DELAY_MS = 300;

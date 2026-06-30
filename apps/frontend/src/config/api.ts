import { isDemoMode } from '@/data-provider/types';

const WILMS_API_PATH = '/api/wilms';

function normalizeApiBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  if (withoutTrailingSlash.endsWith(WILMS_API_PATH)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}${WILMS_API_PATH}`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const API_TIMEOUT_MS = 10_000;

/** True when mock data providers are active (dev, staging without API, or forced demo). */
export const USE_MOCK_SERVICES = isDemoMode();

export const MOCK_SERVICE_DELAY_MS = 300;

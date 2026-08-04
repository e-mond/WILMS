/**
 * Validates outbound redirect URLs for email click tracking.
 *
 * Prevents open-redirect phishing by allowing only hosts derived from
 * WILMS_APP_URL, WILMS_CORS_ORIGIN, and the default production hostname.
 */
import { env } from '../config/env.js';

const DEFAULT_REDIRECT = 'https://wilms.vercel.app';

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(['wilms.vercel.app', 'localhost']);
  const appUrl = env.appUrl;
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).host);
    } catch {
      // ignore malformed app URL
    }
  }
  const corsOrigin = process.env.WILMS_CORS_ORIGIN?.trim();
  if (corsOrigin) {
    try {
      hosts.add(new URL(corsOrigin).host);
    } catch {
      // ignore malformed cors origin
    }
  }
  return hosts;
}

/** Validates redirect targets to prevent open-redirect phishing via tracking links. */
export function validateSafeRedirectUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return env.appUrl ?? DEFAULT_REDIRECT;
    }
    if (!allowedHosts().has(parsed.host)) {
      return env.appUrl ?? DEFAULT_REDIRECT;
    }
    return parsed.toString();
  } catch {
    return env.appUrl ?? DEFAULT_REDIRECT;
  }
}

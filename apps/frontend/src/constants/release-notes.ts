/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.5.1',
  summary:
    'Vercel full-stack recovery — API Route Handlers no longer crash at import when domain secrets are missing; health and BFF return JSON errors instead of HTML 500 pages.',
  highlights: [
    'Serverless bootstrap tolerates missing WILMS_SESSION_SECRET at import time (still fails closed for signed sessions until configured).',
    '/api/wilms/* lazy-loads @wilms/domain and returns JSON 503 on handler failure.',
    'Proxy mode activates only for a valid http(s) WILMS_API_UPSTREAM.',
    'Set DATABASE_URL + WILMS_SESSION_SECRET on Vercel for production data and auth.',
  ],
};

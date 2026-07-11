/** Shown in the in-app update prompt when a new service worker is waiting. */
export interface ReleaseNotes {
  version: string;
  summary: string;
  highlights: string[];
}

export const CURRENT_RELEASE_NOTES: ReleaseNotes = {
  version: '1.3.5',
  summary: 'Premium splash, unified email design system, and notification center refresh.',
  highlights: [
    'Animated startup splash with reduced-motion support.',
    'Login page simplified — mission tagline moved to email communications only.',
    'Expanded email catalogue with status banners, privacy footer, and new security templates.',
    'Notification center search, categories, pagination, and archive actions.',
    'User notification preferences respected by transactional email dispatch.',
  ],
};

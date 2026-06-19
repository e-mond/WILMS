/**
 * Semantic design token class maps for programmatic use.
 * Prefer Tailwind utilities in components; use these maps for status-driven UI.
 */

export const STATUS_TOKEN_CLASSES = {
  active: {
    text: 'text-status-active',
    bg: 'bg-status-active-light',
    border: 'border-status-active',
  },
  atRisk: {
    text: 'text-status-at-risk',
    bg: 'bg-status-at-risk-light',
    border: 'border-status-at-risk',
  },
  defaulted: {
    text: 'text-status-defaulted',
    bg: 'bg-status-defaulted-light',
    border: 'border-status-defaulted',
  },
  blacklisted: {
    text: 'text-status-blacklisted',
    bg: 'bg-status-blacklisted-light',
    border: 'border-status-blacklisted',
  },
  pending: {
    text: 'text-status-pending',
    bg: 'bg-status-pending-light',
    border: 'border-status-pending',
  },
} as const;

export type StatusTokenKey = keyof typeof STATUS_TOKEN_CLASSES;

export const TYPOGRAPHY_TOKEN_CLASSES = {
  display: 'text-display font-bold',
  heading1: 'text-heading-1 font-bold',
  heading2: 'text-heading-2 font-semibold',
  heading3: 'text-heading-3 font-semibold',
  body: 'text-body font-normal',
  small: 'text-small font-normal',
  mono: 'text-mono font-mono font-normal',
} as const;

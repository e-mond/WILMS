import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'brand-primary': {
          DEFAULT: 'var(--color-brand-primary)',
          light: 'var(--color-brand-primary-light)',
        },
        'status-active': {
          DEFAULT: 'var(--color-status-active)',
          light: 'var(--color-status-active-light)',
        },
        'status-at-risk': {
          DEFAULT: 'var(--color-status-at-risk)',
          light: 'var(--color-status-at-risk-light)',
        },
        'status-defaulted': {
          DEFAULT: 'var(--color-status-defaulted)',
          light: 'var(--color-status-defaulted-light)',
        },
        'status-blacklisted': {
          DEFAULT: 'var(--color-status-blacklisted)',
          light: 'var(--color-status-blacklisted-light)',
        },
        'status-pending': {
          DEFAULT: 'var(--color-status-pending)',
          light: 'var(--color-status-pending-light)',
        },
        'status-info': {
          DEFAULT: 'var(--color-status-info)',
          light: 'var(--color-status-info-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          light: 'var(--color-danger-light)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        executive: {
          sidebar: 'var(--color-executive-sidebar)',
          gold: 'var(--color-executive-gold)',
          'gold-muted': 'var(--color-executive-gold-muted)',
        },
      },
      fontSize: {
        display: ['1.875rem', { lineHeight: '1.2' }],
        'heading-1': ['1.5rem', { lineHeight: '1.3' }],
        'heading-2': ['1.25rem', { lineHeight: '1.4' }],
        'heading-3': ['1rem', { lineHeight: '1.5' }],
        body: ['0.875rem', { lineHeight: '1.6' }],
        small: ['0.75rem', { lineHeight: '1.5' }],
        mono: ['0.8125rem', { lineHeight: '1.4' }],
      },
      spacing: {
        'wilms-1': '0.25rem',
        'wilms-2': '0.5rem',
        'wilms-3': '0.75rem',
        'wilms-4': '1rem',
        'wilms-6': '1.5rem',
        'wilms-8': '2rem',
        'wilms-12': '3rem',
      },
      borderRadius: { none: '0', sm: '2px' },
      boxShadow: { none: 'none' },
    },
  },
  plugins: [],
};

export default config;

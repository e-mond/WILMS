import { describe, expect, it } from 'vitest';
import tailwindConfig from '../../tailwind.config';
import {
  STATUS_TOKEN_CLASSES,
  TYPOGRAPHY_TOKEN_CLASSES,
} from '@/constants/design-tokens';

describe('design tokens', () => {
  it('defines semantic colour tokens in tailwind config', () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, unknown>;

    expect(colors).toMatchObject({
      background: 'var(--color-background)',
      card: 'var(--color-card)',
      'text-primary': 'var(--color-text-primary)',
      'text-muted': 'var(--color-text-muted)',
    });

    expect(colors['brand-primary']).toMatchObject({
      DEFAULT: 'var(--color-brand-primary)',
      light: 'var(--color-brand-primary-light)',
    });
  });

  it('defines typography tokens in tailwind config', () => {
    const fontSize = tailwindConfig.theme?.extend?.fontSize as Record<
      string,
      [string, { lineHeight: string }]
    >;

    expect(fontSize.display).toEqual(['1.875rem', { lineHeight: '1.2' }]);
    expect(fontSize.body).toEqual(['0.875rem', { lineHeight: '1.6' }]);
  });

  it('exports status token class maps', () => {
    expect(STATUS_TOKEN_CLASSES.active.text).toBe('text-status-active');
    expect(TYPOGRAPHY_TOKEN_CLASSES.mono).toContain('font-mono');
  });
});

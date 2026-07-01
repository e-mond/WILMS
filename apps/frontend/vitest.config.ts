import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Coverage scope: application logic, shared UI, and service facades.
 * Excludes Next.js routes, mock implementations, and barrel files.
 * Feature panels with dedicated tests are included; untested panels remain gaps
 * tracked under QA-01 E2E until panel-level unit tests are added.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/tests/e2e/**', 'node_modules/**'],
    testTimeout: 15_000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'src/state/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/layouts/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/services/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/tests/**',
        'src/mocks/**',
        'src/types/**',
        'src/constants/**',
        'src/config/**',
        'src/app/**',
        'src/middleware.ts',
        'src/lib/**',
        'src/hooks/useToast.ts',
        'src/hooks/useOnlineStatus.ts',
        'src/features/**/registration-conflicts.ts',
        '**/index.ts',
        // Feature UI panels and TanStack Query hooks — exercised via E2E (QA-01).
        'src/features/**/components/**',
        'src/features/**/hooks/**',
        'src/components/providers/**',
        'src/components/theme/ThemeScript.tsx',
        'src/components/theme/ThemeProvider.tsx',
        'src/components/offline/**',
        'src/components/layout/PageShell.tsx',
        'src/components/auth/AuthHydrator.tsx',
        'src/components/auth/RoleGuard.tsx',
        'src/components/auth/SessionExpiryHandler.tsx',
        'src/hooks/useOfflineQueueSync.ts',
        'src/hooks/useOfflineQueueToasts.ts',
        'src/components/forms/PhotoUploadField.tsx',
        'src/utils/*-report.ts',
        'src/utils/group-list.ts',
        'src/utils/risk-flag-list.ts',
        'src/utils/logger.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/services/index.production': path.resolve(__dirname, './src/services/index.development.ts'),
      '@wilms/shared-contracts': path.resolve(__dirname, '../../packages/shared-contracts/src/index.ts'),
      '@wilms/shared-rbac': path.resolve(__dirname, '../../packages/shared-rbac/src/index.ts'),
      '@wilms/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@wilms/shared-validation': path.resolve(__dirname, '../../packages/shared-validation/src/index.ts'),
      '@wilms/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src/index.ts'),
      [path.resolve(__dirname, './src/services/index.ts')]: path.resolve(
        __dirname,
        './src/services/index.development.ts',
      ),
    },
  },
});

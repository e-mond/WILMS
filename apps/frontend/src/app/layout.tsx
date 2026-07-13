import type { Metadata } from 'next';
import { AuthHydrator } from '@/components/auth/AuthHydrator';
import { AppLockHandler } from '@/components/auth/AppLockHandler';
import { SessionExpiryHandler } from '@/components/auth/SessionExpiryHandler';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { FocusOnRouteChange } from '@/components/accessibility/FocusOnRouteChange';
import { RouteTransitionLoader } from '@/components/feedback/RouteTransitionLoader';
import { AppBootstrap } from '@/components/providers/AppBootstrap';
import { PermissionProvider } from '@/components/providers/PermissionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeScript } from '@/components/theme/ThemeScript';
import { ConnectionStatusBar } from '@/components/layout/shell/ConnectionStatusBar';
import { E2eBridge } from '@/components/dev/E2eBridge';
import { DemoModeBanner } from '@/components/feedback/DemoModeBanner';
import { isDemoMode } from '@/data-provider/types';
import { ToastContainer } from '@/components/feedback/ToastContainer';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { PwaIosInstallPrompt } from '@/components/pwa/PwaIosInstallPrompt';
import { AppUpdatePrompt } from '@/components/pwa/AppUpdatePrompt';
import { ChunkRecoveryHandler } from '@/components/pwa/ChunkRecoveryHandler';
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar';
import { getServerSession } from '@/lib/auth/server-session';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'WILMS',
  description: "Women's Interest-Free Loan Management System",
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-192-dark.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="WILMS" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-background text-text-primary">
        <SkipToContent />
        <ServiceWorkerRegistrar />
        <ChunkRecoveryHandler />
        <AppUpdatePrompt />
        {isDemoMode() ? (
          <>
            <DemoModeBanner />
            {process.env.NODE_ENV === 'development' ? <E2eBridge /> : null}
          </>
        ) : null}
        <PwaInstallBanner />
        <PwaIosInstallPrompt />
        <AuthHydrator session={session}>
          <ThemeProvider>
            <QueryProvider>
              <PermissionProvider>
                <AppBootstrap>
                <RouteTransitionLoader />
                <FocusOnRouteChange />
                <SessionExpiryHandler />
                <AppLockHandler />
                <ToastContainer />
                <ConnectionStatusBar />
                {children}
              </AppBootstrap>
              </PermissionProvider>
            </QueryProvider>
          </ThemeProvider>
        </AuthHydrator>
      </body>
    </html>
  );
}

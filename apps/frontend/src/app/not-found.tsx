import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-background p-wilms-4 outline-none"
    >
      <div className="w-full max-w-md space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-6 text-center">
        <p className="text-small font-semibold uppercase tracking-wide text-executive-gold">404</p>
        <h1 className="text-heading-1 font-semibold text-text-primary">Page not found</h1>
        <p className="text-body text-text-muted">
          The page you requested is not available in WILMS. Check the address or return to your
          dashboard.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body font-semibold text-card hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}

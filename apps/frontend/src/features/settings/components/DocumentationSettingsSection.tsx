'use client';

import Link from 'next/link';
import { BookOpen, Download, Search } from 'lucide-react';
import { DOCUMENTATION_STATS } from '@/features/documentation/catalog';

export function DocumentationSettingsSection() {
  return (
    <section className="space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-5">
      <div>
        <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
          Knowledge centre
        </p>
        <h2 className="mt-wilms-1 text-heading-2 font-semibold text-text-primary">
          WILMS Documentation Centre
        </h2>
        <p className="mt-wilms-2 max-w-2xl text-body text-text-muted">
          Browse the official product library in-app — search, read, print, and download PDF or Word
          editions without leaving WILMS.
        </p>
      </div>

      <dl className="grid gap-wilms-3 sm:grid-cols-3">
        <div className="rounded-sm border border-border px-wilms-3 py-wilms-3">
          <dt className="text-small text-text-muted">Library version</dt>
          <dd className="font-semibold text-text-primary">v{DOCUMENTATION_STATS.libraryVersion}</dd>
        </div>
        <div className="rounded-sm border border-border px-wilms-3 py-wilms-3">
          <dt className="text-small text-text-muted">Books</dt>
          <dd className="font-semibold text-text-primary">{DOCUMENTATION_STATS.bookCount}</dd>
        </div>
        <div className="rounded-sm border border-border px-wilms-3 py-wilms-3">
          <dt className="text-small text-text-muted">Status</dt>
          <dd className="font-semibold text-text-primary">{DOCUMENTATION_STATS.status}</dd>
        </div>
      </dl>

      <ul className="space-y-2 text-small text-text-muted">
        <li className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-primary" /> Book-quality reader with interactive contents
        </li>
        <li className="flex items-center gap-2">
          <Search className="h-4 w-4 text-brand-primary" /> Full-library search across titles and headings
        </li>
        <li className="flex items-center gap-2">
          <Download className="h-4 w-4 text-brand-primary" /> Direct PDF and Word downloads
        </li>
      </ul>

      <Link
        href="/documentation"
        className="inline-flex min-h-[44px] items-center rounded-sm bg-brand-primary px-wilms-4 text-small font-semibold text-white hover:opacity-95"
      >
        Open Documentation Centre
      </Link>
    </section>
  );
}

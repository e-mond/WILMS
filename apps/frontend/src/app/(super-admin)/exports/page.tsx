import { redirect } from 'next/navigation';

/**
 * Standalone Export Center removed in v1.7.3.
 * Preserve the URL with a redirect so bookmarks land on Reports (contextual exports).
 */
export default function ExportsRemovedRedirectPage() {
  redirect('/reports');
}

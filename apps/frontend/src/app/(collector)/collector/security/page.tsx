import { redirect } from 'next/navigation';

/** Legacy route — app lock is configured under Settings → App Lock. */
export default function CollectorSecurityPage() {
  redirect('/collector/settings');
}

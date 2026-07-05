import Link from 'next/link';
import { ModulePageIntro } from '@/components/feedback/ModulePageIntro';
import { PageShell } from '@/components/layout/PageShell';
import { MyRegistrationsList } from '@/features/borrower-registration/components/MyRegistrationsList';

export default function MyRegistrationsPage() {
  return (
    <PageShell
      variant="executive"
      actions={
        <Link
          href="/officer/register"
          className="inline-flex h-10 items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body font-semibold text-card transition-opacity hover:opacity-90"
        >
          Register borrower
        </Link>
      }
    >
      <ModulePageIntro guidanceKey="officerRegistrations" />
      <MyRegistrationsList />
    </PageShell>
  );
}

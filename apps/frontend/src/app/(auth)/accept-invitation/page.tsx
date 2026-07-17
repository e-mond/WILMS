import { Suspense } from 'react';
import { AcceptInvitationRedirect } from '@/features/authentication/components/AcceptInvitationRedirect';
import { FormPanelSkeleton } from '@/components/feedback/PageSkeletons';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AcceptInvitationPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-background p-wilms-4 outline-none"
    >
      <div className="mb-wilms-4 flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[200px] w-full max-w-md items-center justify-center rounded-sm border border-border bg-card">
            <FormPanelSkeleton fields={3} />
          </div>
        }
      >
        <AcceptInvitationRedirect />
      </Suspense>
    </main>
  );
}

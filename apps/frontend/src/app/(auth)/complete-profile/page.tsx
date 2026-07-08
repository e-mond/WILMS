import { CompleteProfileForm } from '@/features/authentication/components/CompleteProfileForm';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function CompleteProfilePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-background p-wilms-4 outline-none"
    >
      <div className="mb-wilms-4 flex w-full max-w-lg justify-end">
        <ThemeToggle />
      </div>
      <CompleteProfileForm />
    </main>
  );
}

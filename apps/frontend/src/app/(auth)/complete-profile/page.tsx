import { CompleteProfileForm } from '@/features/authentication/components/CompleteProfileForm';
import { AuthPageShell } from '@/features/authentication/components/AuthPageShell';

export default function CompleteProfilePage() {
  return (
    <AuthPageShell contentClassName="max-w-[480px]" helpHref="/login" helpLabel="Sign in">
      <CompleteProfileForm />
    </AuthPageShell>
  );
}

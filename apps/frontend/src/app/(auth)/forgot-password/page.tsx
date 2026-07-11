import { ForgotPasswordForm } from '@/features/authentication/components/ForgotPasswordForm';
import { AuthPageShell } from '@/features/authentication/components/AuthPageShell';

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell contentClassName="max-w-[480px]" helpHref="/login" helpLabel="Sign in">
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}

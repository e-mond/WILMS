import { ForgotPasswordForm } from '@/features/authentication/components/ForgotPasswordForm';
import { AuthBrandHeader } from '@/features/authentication/components/AuthBrandHeader';
import { AuthPageFooter } from '@/features/authentication/components/AuthPageFooter';

export default function ForgotPasswordPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-wilms-4 py-wilms-8 outline-none"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)] motion-reduce:bg-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[480px] flex-col">
        <AuthBrandHeader className="mb-wilms-8 lg:mb-10" />

        <ForgotPasswordForm />

        <AuthPageFooter className="mt-wilms-6" helpHref="/login" helpLabel="Sign in" />
      </div>
    </main>
  );
}

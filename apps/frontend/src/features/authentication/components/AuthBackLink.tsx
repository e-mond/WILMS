import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AuthBackLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export function AuthBackLink({
  href = '/login',
  label = 'Back to Sign In',
  className,
}: AuthBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center gap-wilms-2 text-small font-semibold text-text-secondary transition-colors hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

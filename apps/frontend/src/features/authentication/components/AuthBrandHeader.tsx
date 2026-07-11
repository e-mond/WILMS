import { cn } from '@/utils/cn';

export interface AuthBrandHeaderProps {
  className?: string;
  tagline?: string;
}

export function AuthBrandHeader({
  className,
  tagline = "Women's Interest-Free Loan Management",
}: AuthBrandHeaderProps) {
  return (
    <header className={cn('flex flex-col items-center gap-wilms-3 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-brand-primary-light ring-1 ring-executive-gold/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 object-cover"
        />
      </div>
      <div className="space-y-wilms-1">
        <p className="text-heading-1 font-bold tracking-wider text-executive-gold">WILMS</p>
        <p className="text-small text-text-secondary">{tagline}</p>
      </div>
    </header>
  );
}

import { cn } from '@/utils/cn';

export const AUTH_APPLICATION_NAME = "Women's Interest-Free Loan Management";
export const AUTH_MISSION_TAGLINE = 'Helping women grow through interest-free financing.';

export interface AuthBrandHeaderProps {
  className?: string;
}

export function AuthBrandHeader({ className }: AuthBrandHeaderProps) {
  return (
    <header className={cn('flex flex-col items-center text-center', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-lg bg-brand-primary-light ring-1 ring-executive-gold/30',
          'h-12 w-12 sm:h-[52px] sm:w-[52px] md:h-14 md:w-14 lg:h-16 lg:w-16',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt="WILMS"
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-wilms-4 flex max-w-[420px] flex-col items-center gap-wilms-2">
        <p className="text-[17px] font-medium leading-snug text-text-secondary sm:text-[18px]">
          {AUTH_APPLICATION_NAME}
        </p>
        <p className="text-[14px] font-normal leading-relaxed text-text-muted sm:text-[15px]">
          {AUTH_MISSION_TAGLINE}
        </p>
      </div>
    </header>
  );
}

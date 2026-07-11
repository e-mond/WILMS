import { cn } from '@/utils/cn';

export const AUTH_APPLICATION_NAME = "Women's Interest-Free Loan Management";

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

      <p className="mt-wilms-4 max-w-[420px] text-[17px] font-medium leading-snug text-text-secondary sm:text-[18px]">
        {AUTH_APPLICATION_NAME}
      </p>
    </header>
  );
}

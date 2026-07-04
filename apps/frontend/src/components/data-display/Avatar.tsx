import { cn } from '@/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  label: string;
  photoUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-small',
  md: 'h-9 w-9 text-small',
  lg: 'h-12 w-12 text-body',
};

export function Avatar({ label, photoUrl, size = 'md', className }: AvatarProps) {
  const safeLabel = (label ?? '').trim() || 'User';
  const initials = safeLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={safeLabel}
        className={cn('inline-flex shrink-0 rounded-full border border-border object-cover', SIZE_CLASS[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-brand-primary bg-brand-primary-light font-bold text-brand-primary',
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}

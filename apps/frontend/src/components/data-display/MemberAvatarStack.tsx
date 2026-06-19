import { Avatar } from '@/components/data-display/Avatar';
import { cn } from '@/utils/cn';

export interface MemberAvatarStackProps {
  members: readonly string[];
  totalCount?: number;
  className?: string;
}

export function MemberAvatarStack({ members, totalCount, className }: MemberAvatarStackProps) {
  const visible = members.slice(0, 9);
  const overflow = (totalCount ?? members.length) - visible.length;

  if (visible.length === 0) {
    return <p className="text-small text-text-muted">No members listed.</p>;
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {visible.map((name) => (
          <Avatar key={name} label={name} size="sm" className="ring-2 ring-card" />
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-wilms-2 text-small font-semibold text-text-muted">+{overflow}</span>
      ) : null}
    </div>
  );
}

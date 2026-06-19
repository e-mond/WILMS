import { cn } from '@/utils/cn';

export interface UtilisationBarProps {
  percent: number;
  className?: string;
}

export function UtilisationBar({ percent, className }: UtilisationBarProps) {
  const tone =
    percent >= 95 ? 'bg-danger' : percent >= 80 ? 'bg-status-at-risk' : 'bg-status-active';

  return (
    <div className={cn('flex items-center gap-wilms-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-border">
        <div className={cn('h-full rounded-sm', tone)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className="text-small font-semibold text-text-primary">{percent}%</span>
    </div>
  );
}

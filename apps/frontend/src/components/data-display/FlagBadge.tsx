import { FLAG_TYPE_DISPLAY } from '@/constants/risk-flag-display';
import { Badge } from '@/components/ui/Badge';
import type { FlagType } from '@/types/risk-flag';

export interface FlagBadgeProps {
  flagType: FlagType;
  className?: string;
}

export function FlagBadge({ flagType, className }: FlagBadgeProps) {
  const display = FLAG_TYPE_DISPLAY[flagType];

  return (
    <Badge variant={display.variant} className={className}>
      {display.label}
    </Badge>
  );
}

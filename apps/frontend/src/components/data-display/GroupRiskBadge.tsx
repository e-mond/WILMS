import { Badge } from '@/components/ui/Badge';
import { GROUP_RISK_DISPLAY } from '@/constants/group-risk-display';
import type { GroupRiskLevel } from '@/types/group';

export interface GroupRiskBadgeProps {
  riskLevel: GroupRiskLevel;
  className?: string;
}

export function GroupRiskBadge({ riskLevel, className }: GroupRiskBadgeProps) {
  const display = GROUP_RISK_DISPLAY[riskLevel];

  return (
    <Badge variant={display.variant} className={className}>
      {display.label}
    </Badge>
  );
}

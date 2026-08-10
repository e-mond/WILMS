import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  Flag,
  Gauge,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  Percent,
  PieChart,
  Send,
  ShieldAlert,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';

const ICON_CLASS = 'h-4 w-4';

function icon(node: ReactNode): ReactNode {
  return node;
}

/**
 * Default KPI glyph from the card label so every page gets an icon without
 * per-callsite wiring. Explicit `icon` props on KpiCard still win.
 */
export function resolveKpiIcon(label: string): ReactNode {
  const key = label.trim().toLowerCase();

  if (/blacklist|defaulted|write-?off|par\s*90|risk rating|flagged|suspended|overdue|missed|danger|variance/.test(key)) {
    return icon(
      /blacklist/.test(key) ? (
        <Ban className={ICON_CLASS} aria-hidden="true" />
      ) : (
        <ShieldAlert className={ICON_CLASS} aria-hidden="true" />
      ),
    );
  }
  if (/par\s*60|par\s*30|aging|delinquen|at risk|alert/.test(key)) {
    return icon(<AlertTriangle className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/outstanding|due|awaiting|pending|queue/.test(key)) {
    return icon(<CircleAlert className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/collect(ed|ion)|recover|repay|paid/.test(key)) {
    return icon(<Banknote className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/disburs|loan|portfolio|principal|amount/.test(key)) {
    return icon(<HandCoins className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/cash|liquidity|wallet|operating|fee|admin fee/.test(key)) {
    return icon(<Wallet className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/expense|cost|spend/.test(key)) {
    return icon(<CircleDollarSign className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/rate|%|percent|ratio|utilisation|utilization/.test(key)) {
    return icon(<Percent className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/group/.test(key)) {
    return icon(<UsersRound className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/borrower|member|user|people|community/.test(key)) {
    return icon(<Users className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/collector|officer|staff/.test(key)) {
    return icon(<UserRound className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/reconcil/.test(key)) {
    return icon(<ClipboardList className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/notif|message|sent|inbox/.test(key)) {
    return icon(<Bell className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/holiday|calendar|schedule|duration|week/.test(key)) {
    return icon(<CalendarDays className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/ledger|audit|entr(y|ies)|log/.test(key)) {
    return icon(<FileText className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/flag/.test(key)) {
    return icon(<Flag className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/closed|complete|approved|success|^active$|active loans|active borrowers|showing|total registered/.test(key)) {
    return icon(<BadgeCheck className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/draft|review|application/.test(key)) {
    return icon(<ListChecks className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/connection|online|offline|wifi|sync/.test(key)) {
    return icon(
      /offline|off/.test(key) ? (
        <WifiOff className={ICON_CLASS} aria-hidden="true" />
      ) : (
        <Wifi className={ICON_CLASS} aria-hidden="true" />
      ),
    );
  }
  if (/trend|forecast|growth/.test(key)) {
    return icon(<TrendingUp className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/timer|sla|aging|days/.test(key)) {
    return icon(<Timer className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/time|clock|streak/.test(key)) {
    return icon(<Clock3 className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/send|dispatch|outbound/.test(key)) {
    return icon(<Send className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/gauge|score|performance/.test(key)) {
    return icon(<Gauge className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/chart|summary|report|board/.test(key)) {
    return icon(<BarChart3 className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/pie|split|share/.test(key)) {
    return icon(<PieChart className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/pool|capital|funding/.test(key)) {
    return icon(<Briefcase className={ICON_CLASS} aria-hidden="true" />);
  }
  if (/dashboard|overview/.test(key)) {
    return icon(<LayoutDashboard className={ICON_CLASS} aria-hidden="true" />);
  }

  return icon(<LayoutDashboard className={ICON_CLASS} aria-hidden="true" />);
}

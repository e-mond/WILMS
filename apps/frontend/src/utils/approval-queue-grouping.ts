import type { PendingApplicationSummary } from '@/types/borrower';
import { formatDisplayDate } from '@/utils/format-date';

export interface PendingApplicationDateGroup {
  dateLabel: string;
  applications: PendingApplicationSummary[];
}

export interface PendingApplicationCommunityGroup {
  community: string;
  dateGroups: PendingApplicationDateGroup[];
  totalApplications: number;
}

function resolveRegistrationDateKey(registeredAt: string): string {
  return registeredAt.slice(0, 10);
}

export function groupPendingApplicationsByCommunityAndDate(
  applications: PendingApplicationSummary[],
): PendingApplicationCommunityGroup[] {
  const byCommunity = new Map<string, PendingApplicationSummary[]>();

  for (const application of applications) {
    const communityApplications = byCommunity.get(application.community) ?? [];
    communityApplications.push(application);
    byCommunity.set(application.community, communityApplications);
  }

  return Array.from(byCommunity.entries())
    .map(([community, communityApplications]) => {
      const byDate = new Map<string, PendingApplicationSummary[]>();

      for (const application of communityApplications) {
        const dateKey = resolveRegistrationDateKey(application.registeredAt);
        const dateApplications = byDate.get(dateKey) ?? [];
        dateApplications.push(application);
        byDate.set(dateKey, dateApplications);
      }

      const dateGroups = Array.from(byDate.entries())
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([dateKey, dateApplications]) => ({
          dateLabel: formatDisplayDate(dateKey),
          applications: dateApplications.sort((left, right) =>
            left.fullName.localeCompare(right.fullName),
          ),
        }));

      return {
        community,
        dateGroups,
        totalApplications: communityApplications.length,
      };
    })
    .sort((left, right) => left.community.localeCompare(right.community));
}

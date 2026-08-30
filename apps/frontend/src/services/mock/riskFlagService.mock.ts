import type { RiskFlagDetail, CreateRiskFlagInput, RiskFlagAssigneeOption } from '@/types/risk-flag';
import { FLAG_STATUS } from '@/types/risk-flag';
import type { IRiskFlagService } from '@/types/services';
import { getRiskFlagsDemoDataset } from '@/services/mock/factories/risk-flags-demo.factory';
import { simulateDelay } from '@/services/mock/delay';
import { buildDefaultFlagTimeline } from '@/utils/risk-flag-list';
import { ROLE_LABELS, USER_ROLE } from '@/constants/roles';
import { getSettingsUsersStore } from '@/services/mock/settings-users.store';

const ASSIGNABLE_ROLES = new Set([
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.APPROVER,
  USER_ROLE.REGISTRATION_OFFICER,
]);

const riskFlagServiceMock: IRiskFlagService = {
  async listRiskFlags() {
    await simulateDelay();
    return getRiskFlagsDemoDataset();
  },

  async listRiskFlagAssignees(): Promise<RiskFlagAssigneeOption[]> {
    await simulateDelay();
    return getSettingsUsersStore()
      .filter((user) => user.status === 'ACTIVE' && ASSIGNABLE_ROLES.has(user.role as typeof USER_ROLE.SUPER_ADMIN))
      .map((user) => ({
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        roleLabel: user.roleLabel || ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role,
      }));
  },

  async getRiskFlag(id: string) {
    await simulateDelay();

    const { flags } = getRiskFlagsDemoDataset();
    const flag = flags.find((entry) => entry.id === id);

    if (!flag) {
      throw new Error('Risk flag not found');
    }

    const detail: RiskFlagDetail = {
      ...flag,
      activeMembers: flag.activeMembers ?? (flag.entityType === 'GROUP' ? 9 : undefined),
      totalMembers: flag.totalMembers ?? (flag.entityType === 'GROUP' ? 16 : undefined),
      timeline: buildDefaultFlagTimeline(flag),
    };
    return detail;
  },

  async createRiskFlag(input: CreateRiskFlagInput) {
    await simulateDelay();
    const detail: RiskFlagDetail = {
      id: `flag-${Date.now()}`,
      entityId: input.entityId,
      entityName: input.entityName,
      entityType: input.entityType,
      flagType: input.flagType,
      community: input.community,
      officerName: input.officerName ?? 'Super Admin',
      raisedAt: new Date().toISOString(),
      arrearsPesewas: input.arrearsPesewas ?? 0,
      status: FLAG_STATUS.OPEN,
      timeline: [],
    };
    return detail;
  },

  async escalateRiskFlag(id: string) {
    const detail = await this.getRiskFlag(id);
    return {
      ...detail,
      status: FLAG_STATUS.CRITICAL,
      flagType: 'BLACKLISTED' as const,
      escalation: {
        borrowerBlacklisted: false,
        message:
          'Flag marked critical for blacklist review. Active borrowers are not auto-blacklisted — complete a formal blacklist action if required.',
      },
    };
  },

  async resolveRiskFlag(id: string) {
    const detail = await this.getRiskFlag(id);
    return { ...detail, status: FLAG_STATUS.RESOLVED };
  },

  async assignRiskFlag(id: string, input: { assignedToUserId: string }) {
    const detail = await this.getRiskFlag(id);
    const assignee = getSettingsUsersStore().find((user) => user.id === input.assignedToUserId);
    return {
      ...detail,
      assignedToUserId: input.assignedToUserId,
      assignedToName: assignee?.displayName,
      officerName: assignee?.displayName ?? detail.officerName,
      status: detail.status === FLAG_STATUS.OPEN ? FLAG_STATUS.UNDER_REVIEW : detail.status,
    };
  },
};

export default riskFlagServiceMock;

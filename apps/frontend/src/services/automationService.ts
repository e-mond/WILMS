import { apiClient } from '@/utils/apiClient';

export interface AutomationRule {
  id: string;
  name: string;
  category: string;
  triggerType: string;
  enabled?: boolean;
  conditions?: Record<string, unknown>;
  actions?: unknown[];
  scheduleCron?: string | null;
}

export interface AutomationTask {
  id: string;
  title: string;
  category: string;
  status?: string;
  assigneeUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt?: string;
}

export const automationService = {
  listRules(): Promise<{ rules: AutomationRule[] }> {
    return apiClient.get<{ rules: AutomationRule[] }>('/automation/rules');
  },

  listTasks(mine = false): Promise<{ tasks: AutomationTask[] }> {
    const query = mine ? '?mine=1' : '';
    return apiClient.get<{ tasks: AutomationTask[] }>(`/automation/tasks${query}`);
  },

  setRuleEnabled(id: string, enabled: boolean): Promise<AutomationRule> {
    return apiClient.patch<AutomationRule>(`/automation/rules/${id}`, { enabled });
  },

  runDailyPass(): Promise<{
    rulesEnsured: number;
    remindersEvaluated: number;
    escalationsEvaluated: number;
    followUpsCreated: number;
    executivePackRecipients: number;
    runId: string | null;
  }> {
    return apiClient.post('/automation/run-daily', {});
  },
};

export default automationService;

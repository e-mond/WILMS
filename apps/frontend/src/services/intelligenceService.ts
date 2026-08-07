import type {
  AlertThreshold,
  CompliancePack,
  CreateExportJobInput,
  CreateIncidentInput,
  CreateMaintenanceWindowInput,
  EarlyWarningEvaluation,
  EarlyWarningEvent,
  ExecutiveDashboard,
  ExecutiveDashboardParams,
  ExportJob,
  ForecastSnapshot,
  MaintenanceWindow,
  OperationalIncident,
  PortfolioBreakdown,
} from '@/types/intelligence';
import { apiClient } from '@/utils/apiClient';

function buildQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const intelligenceService = {
  getExecutiveDashboard(params?: ExecutiveDashboardParams): Promise<ExecutiveDashboard> {
    return apiClient.get<ExecutiveDashboard>(
      `/intelligence/executive-dashboard${buildQuery({
        district: params?.district,
        community: params?.community,
        asOf: params?.asOf,
      })}`,
    );
  },

  getForecast(horizonDays = 28): Promise<ForecastSnapshot> {
    return apiClient.get<ForecastSnapshot>(
      `/intelligence/forecast${buildQuery({ horizonDays })}`,
    );
  },

  getPortfolioBreakdown(): Promise<PortfolioBreakdown> {
    return apiClient.get<PortfolioBreakdown>('/intelligence/portfolio-breakdown');
  },

  getCompliance(): Promise<CompliancePack> {
    return apiClient.get<CompliancePack>('/intelligence/compliance');
  },

  listEarlyWarnings(): Promise<EarlyWarningEvent[]> {
    return apiClient.get<EarlyWarningEvent[]>('/intelligence/early-warnings');
  },

  evaluateEarlyWarnings(): Promise<EarlyWarningEvaluation> {
    return apiClient.post<EarlyWarningEvaluation>('/intelligence/early-warnings/evaluate', {});
  },

  listAlertThresholds(): Promise<AlertThreshold[]> {
    return apiClient.get<AlertThreshold[]>('/intelligence/alert-thresholds');
  },

  upsertAlertThreshold(input: {
    key: string;
    label: string;
    metric: string;
    operator?: string;
    thresholdValue: number;
    severity?: string;
    enabled?: boolean;
  }): Promise<AlertThreshold> {
    return apiClient.put<AlertThreshold>('/intelligence/alert-thresholds', input);
  },

  listExportJobs(): Promise<ExportJob[]> {
    return apiClient.get<ExportJob[]>('/exports/jobs');
  },

  createExportJob(input: CreateExportJobInput): Promise<ExportJob> {
    return apiClient.post<ExportJob>('/exports/jobs', input);
  },

  getExportJob(id: string): Promise<ExportJob> {
    return apiClient.get<ExportJob>(`/exports/jobs/${id}`);
  },

  deleteExportJob(id: string): Promise<{ id: string; deleted: boolean }> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/exports/jobs/${id}`);
  },

  regenerateExportJob(id: string): Promise<ExportJob> {
    return apiClient.post<ExportJob>(`/exports/jobs/${id}/regenerate`, {});
  },

  listIncidents(): Promise<OperationalIncident[]> {
    return apiClient.get<OperationalIncident[]>('/ops/incidents');
  },

  createIncident(input: CreateIncidentInput): Promise<OperationalIncident> {
    return apiClient.post<OperationalIncident>('/ops/incidents', input);
  },

  acknowledgeIncident(id: string): Promise<OperationalIncident> {
    return apiClient.post<OperationalIncident>(`/ops/incidents/${id}/acknowledge`, {});
  },

  resolveIncident(id: string, resolution: string): Promise<OperationalIncident> {
    return apiClient.post<OperationalIncident>(`/ops/incidents/${id}/resolve`, { resolution });
  },

  listMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    return apiClient.get<MaintenanceWindow[]>('/ops/maintenance');
  },

  createMaintenanceWindow(input: CreateMaintenanceWindowInput): Promise<MaintenanceWindow> {
    return apiClient.post<MaintenanceWindow>('/ops/maintenance', input);
  },
};

export default intelligenceService;

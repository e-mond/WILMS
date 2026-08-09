import type {
  CreateOrganizationHolidayInput,
  OrganizationHoliday,
} from '@/types/enterprise';
import { apiClient } from '@/utils/apiClient';

export const organizationHolidaysService = {
  listHolidays(params?: {
    includeDisabled?: boolean;
  }): Promise<{ holidays: OrganizationHoliday[] }> {
    const query = params?.includeDisabled ? '?includeDisabled=1' : '';
    return apiClient.get<{ holidays: OrganizationHoliday[] }>(`/organization-holidays${query}`);
  },

  createHoliday(input: CreateOrganizationHolidayInput): Promise<OrganizationHoliday> {
    return apiClient.post<OrganizationHoliday>('/organization-holidays', input);
  },

  updateHoliday(
    id: string,
    input: Partial<CreateOrganizationHolidayInput> & { enabled?: boolean },
  ): Promise<OrganizationHoliday> {
    return apiClient.patch<OrganizationHoliday>(`/organization-holidays/${id}`, input);
  },

  deleteHoliday(id: string): Promise<{ id: string; deleted: boolean }> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/organization-holidays/${id}`);
  },

  syncGhanaHolidays(year?: number): Promise<{
    year: number;
    inserted: number;
    updated: number;
    skipped: number;
    total: number;
  }> {
    return apiClient.post('/organization-holidays/sync-ghana', { year });
  },
};

export default organizationHolidaysService;

import type {
  CreateOrganizationHolidayInput,
  OrganizationHoliday,
} from '@/types/enterprise';
import { apiClient } from '@/utils/apiClient';

export const organizationHolidaysService = {
  listHolidays(): Promise<{ holidays: OrganizationHoliday[] }> {
    return apiClient.get<{ holidays: OrganizationHoliday[] }>('/organization-holidays');
  },

  createHoliday(input: CreateOrganizationHolidayInput): Promise<OrganizationHoliday> {
    return apiClient.post<OrganizationHoliday>('/organization-holidays', input);
  },

  deleteHoliday(id: string): Promise<{ id: string; deleted: boolean }> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/organization-holidays/${id}`);
  },
};

export default organizationHolidaysService;

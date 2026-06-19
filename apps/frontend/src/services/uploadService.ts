import type { UploadFileInput, UploadRecord } from '@/types/upload';
import type { IUploadService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const uploadService: IUploadService = {
  uploadFile(input: UploadFileInput): Promise<UploadRecord> {
    return apiClient.post<UploadRecord>('/uploads', input);
  },

  getUpload(id: string): Promise<UploadRecord | null> {
    return apiClient.get<UploadRecord>(`/uploads/${id}`);
  },

  deleteUpload(id: string): Promise<void> {
    return apiClient.post(`/uploads/${id}/delete`, {});
  },
};

export default uploadService;

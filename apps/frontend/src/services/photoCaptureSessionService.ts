import type { IPhotoCaptureSessionService } from '@/types/services';
import type { PhotoCaptureSession } from '@/types/photo-capture-session';
import { apiClient } from '@/utils/apiClient';

function estimateDataUrlBytes(dataUrl: string): number {
  return Math.ceil((dataUrl.length * 3) / 4);
}

const photoCaptureSessionService: IPhotoCaptureSessionService = {
  createSession(input) {
    return apiClient.post('/registration/capture-sessions', input);
  },

  getSession(sessionToken) {
    return apiClient.get(`/registration/capture-sessions/${sessionToken}`);
  },

  async simulatePhoneCapture(sessionToken: string, dataUrl: string): Promise<PhotoCaptureSession> {
    await apiClient.post(`/photo-capture/sessions/${sessionToken}/upload`, {
      purpose: 'borrower-photo',
      fileName: `${sessionToken}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: estimateDataUrlBytes(dataUrl),
      dataUrl,
    });

    const session = await apiClient.get<PhotoCaptureSession>(
      `/registration/capture-sessions/${sessionToken}`,
    );

    if (!session) {
      throw new Error('Capture session not found after simulated upload.');
    }

    return session;
  },
};

export default photoCaptureSessionService;

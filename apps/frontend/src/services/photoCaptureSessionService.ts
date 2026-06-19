import type { IPhotoCaptureSessionService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const photoCaptureSessionService: IPhotoCaptureSessionService = {
  createSession(input) {
    return apiClient.post('/registration/capture-sessions', input);
  },

  getSession(sessionToken) {
    return apiClient.get(`/registration/capture-sessions/${sessionToken}`);
  },

  simulatePhoneCapture() {
    return Promise.reject(new Error('simulatePhoneCapture is not available in API mode.'));
  },
};

export default photoCaptureSessionService;

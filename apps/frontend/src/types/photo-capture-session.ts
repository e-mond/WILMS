export interface PhotoCaptureSession {
  sessionToken: string;
  captureUrl: string;
  expiresAt: string;
  status: 'PENDING' | 'CAPTURED' | 'EXPIRED';
  capturedFileName?: string;
  capturedMimeType?: string;
  capturedDataUrl?: string;
}

export interface CreatePhotoCaptureSessionInput {
  registrationSessionId: string;
  officerId: string;
  target: 'borrower' | 'guarantor';
}

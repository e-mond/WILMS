import { getUploadConfig } from './config.js';

export function validateUploadInput(input: {
  mimeType: string;
  sizeBytes: number;
}): void {
  const config = getUploadConfig();

  if (input.sizeBytes > config.maxSizeBytes) {
    throw new Error(
      `VALIDATION:File exceeds maximum size of ${config.maxSizeBytes} bytes.`,
    );
  }

  if (!config.allowedMimeTypes.includes(input.mimeType)) {
    throw new Error(`VALIDATION:Mime type ${input.mimeType} is not allowed.`);
  }
}

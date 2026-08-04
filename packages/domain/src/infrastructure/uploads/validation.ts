import { getUploadConfig } from './config.js';
import { assertMimeMatchesMagicBytes } from './magic-bytes.js';

export function validateUploadInput(input: {
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
}): string {
  const config = getUploadConfig();

  if (input.sizeBytes > config.maxSizeBytes) {
    throw new Error(
      `VALIDATION:File exceeds maximum size of ${config.maxSizeBytes} bytes.`,
    );
  }

  if (!config.allowedMimeTypes.includes(input.mimeType)) {
    throw new Error(`VALIDATION:Mime type ${input.mimeType} is not allowed.`);
  }

  if (!input.buffer || input.buffer.length === 0) {
    throw new Error('VALIDATION:Upload content is required for content-type verification.');
  }

  if (input.buffer.length !== input.sizeBytes) {
    throw new Error('VALIDATION:Declared file size does not match upload content.');
  }

  return assertMimeMatchesMagicBytes(input.mimeType, input.buffer);
}

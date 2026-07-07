const ALLOWED_ATTACHMENT_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const DANGEROUS_SIGNATURES: Array<{ bytes: number[]; label: string }> = [
  { bytes: [0x4d, 0x5a], label: 'executable' },
  { bytes: [0x7f, 0x45, 0x4c, 0x46], label: 'elf' },
];

export function validateAttachmentInput(input: {
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
}): void {
  if (input.sizeBytes <= 0) {
    throw new Error('VALIDATION:Attachment file is empty.');
  }

  if (input.sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new Error('VALIDATION:Attachment exceeds maximum size of 10 MB.');
  }

  if (!ALLOWED_ATTACHMENT_MIMES.has(input.mimeType)) {
    throw new Error(`VALIDATION:Attachment type ${input.mimeType} is not allowed.`);
  }

  if (input.buffer) {
    for (const signature of DANGEROUS_SIGNATURES) {
      const matches = signature.bytes.every((byte, index) => input.buffer![index] === byte);
      if (matches) {
        throw new Error('VALIDATION:Attachment failed security validation.');
      }
    }
  }
}

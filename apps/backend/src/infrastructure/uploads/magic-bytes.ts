export type DetectedUploadKind = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

/**
 * Detect content type from file signatures. Does not trust client MIME labels.
 */
export function detectMimeFromMagicBytes(buffer: Buffer): DetectedUploadKind | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // PDF: %PDF
  if (buffer.toString('ascii', 0, 4) === '%PDF') {
    return 'application/pdf';
  }

  return null;
}

export function assertMimeMatchesMagicBytes(
  declaredMime: string,
  buffer: Buffer,
): DetectedUploadKind {
  const detected = detectMimeFromMagicBytes(buffer);
  if (!detected) {
    throw new Error(
      'VALIDATION:File content could not be verified. Upload a JPEG, PNG, WEBP, or PDF file.',
    );
  }

  const normalizedDeclared = declaredMime.trim().toLowerCase();
  if (normalizedDeclared !== detected) {
    throw new Error(
      `VALIDATION:Declared type ${declaredMime} does not match file content (${detected}).`,
    );
  }

  return detected;
}

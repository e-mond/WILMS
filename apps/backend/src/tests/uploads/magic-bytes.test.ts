import { describe, expect, it } from 'vitest';
import {
  assertMimeMatchesMagicBytes,
  detectMimeFromMagicBytes,
} from '../../infrastructure/uploads/magic-bytes.js';

describe('upload magic-byte detection', () => {
  it('detects JPEG PNG WEBP PDF signatures', () => {
    expect(detectMimeFromMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(8)]))).toBe(
      'image/jpeg',
    );
    expect(
      detectMimeFromMagicBytes(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Buffer.alloc(4)]),
      ),
    ).toBe('image/png');
    const webp = Buffer.alloc(12);
    webp.write('RIFF', 0);
    webp.write('WEBP', 8);
    expect(detectMimeFromMagicBytes(webp)).toBe('image/webp');
    expect(detectMimeFromMagicBytes(Buffer.from('%PDF-1.4....'))).toBe('application/pdf');
  });

  it('rejects MIME spoofing', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Buffer.alloc(8)]);
    expect(() => assertMimeMatchesMagicBytes('image/png', jpeg)).toThrow(/does not match/i);
    expect(assertMimeMatchesMagicBytes('image/jpeg', jpeg)).toBe('image/jpeg');
  });
});

'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { uploadService } from '@/services';
import { communicationService } from '@/services';
import { UPLOAD_PURPOSE } from '@/types/upload';
import type { MessageAttachment } from '@/types/communication';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_BYTES = 10 * 1024 * 1024;

interface AttachmentUploaderProps {
  attachments: MessageAttachment[];
  onChange: (attachments: MessageAttachment[]) => void;
  messageId?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function AttachmentUploader({ attachments, onChange, messageId }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`${file.name}: file type not allowed.`);
        }
        if (file.size > MAX_BYTES) {
          throw new Error(`${file.name}: exceeds 10 MB limit.`);
        }

        const dataUrl = await readFileAsDataUrl(file);
        const upload = await uploadService.uploadFile({
          purpose: UPLOAD_PURPOSE.DOCUMENT,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          dataUrl,
        });

        const attachment = await communicationService.createAttachment({
          messageId,
          uploadId: upload.id,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          url: upload.url,
        });

        onChange([...attachments, attachment]);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Upload failed.';
      setError(message);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  async function handleDelete(attachment: MessageAttachment) {
    await communicationService.deleteAttachment(attachment.id);
    onChange(attachments.filter((entry) => entry.id !== attachment.id));
  }

  async function handleReplace(attachment: MessageAttachment, file: File) {
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError('Replacement file is invalid.');
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const upload = await uploadService.uploadFile({
      purpose: UPLOAD_PURPOSE.DOCUMENT,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      dataUrl,
    });

    const replaced = await communicationService.replaceAttachment(attachment.id, {
      uploadId: upload.id,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url: upload.url,
    });

    onChange(attachments.map((entry) => (entry.id === attachment.id ? replaced : entry)));
  }

  return (
    <div className="space-y-wilms-3">
      <div className="flex flex-wrap items-center gap-wilms-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Add attachment'}
        </Button>
        <span className="text-small text-text-muted">PDF, DOCX, XLSX, CSV, PNG, JPG, WEBP — max 10 MB</span>
      </div>

      {error ? <p className="text-small text-danger">{error}</p> : null}

      {attachments.length > 0 ? (
        <ul className="space-y-wilms-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex flex-wrap items-center justify-between gap-wilms-2 rounded-md border border-border p-wilms-3"
            >
              <div className="min-w-0">
                <p className="truncate text-body font-medium text-text-primary">{attachment.fileName}</p>
                <Badge variant="default">{attachment.mimeType}</Badge>
              </div>
              <div className="flex flex-wrap gap-wilms-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center rounded-sm border border-border px-wilms-3 text-small font-semibold"
                >
                  Preview
                </a>
                <a
                  href={attachment.url}
                  download={attachment.fileName}
                  className="inline-flex h-8 items-center rounded-sm border border-border px-wilms-3 text-small font-semibold"
                >
                  Download
                </a>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="file"
                    className="hidden"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleReplace(attachment, file);
                      }
                    }}
                  />
                  <span className="rounded-sm border border-border px-wilms-3 py-wilms-1 text-small">
                    Replace
                  </span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => void handleDelete(attachment)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

# Attachment System Report — v1.2.0

## Supported types

- PDF, DOCX, XLSX, CSV, PNG, JPG, WEBP
- Max size: 10 MB per file

## Storage

- Upload via existing `/uploads` API (Cloudinary or object storage)
- Metadata in `message_attachments` (filename, mime, size, url, upload_id)

## API

| Method | Path | Action |
|--------|------|--------|
| POST | `/communications/attachments` | Create |
| DELETE | `/communications/attachments/:id` | Soft delete + upload cleanup |
| PATCH | `/communications/attachments/:id` | Replace file |
| GET | `/communications/messages/:id/attachments` | List |

## Security

- MIME allowlist in `attachment-validation.ts`
- Dangerous file signature detection (PE/ELF headers)
- Size validation before persist

## Frontend

- `AttachmentUploader` in Communication Center compose modal
- Preview, download, delete, replace actions
- Touch-friendly file input for mobile

## Status

✅ Upload, preview, replace, delete, and email embedding operational.

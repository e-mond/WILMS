# Cloudinary Setup

Production image storage for WILMS uses [Cloudinary](https://cloudinary.com/) on the **backend only**. The frontend never receives `CLOUDINARY_API_SECRET`.

---

## Required environment variables (backend)

Set these in `.env`, `.env.local`, or your deployment platform. **Never commit real values.**

```env
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=wilms
```

Optional:

```env
UPLOAD_MAX_SIZE_BYTES=10485760
UPLOAD_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf
WILMS_UPLOAD_DIR=.wilms-uploads
```

| Variable | Required when | Notes |
|----------|---------------|-------|
| `UPLOAD_PROVIDER` | Always | `local` (default) or `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | `cloudinary` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | `cloudinary` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `cloudinary` | **Backend only** — never expose to frontend |
| `CLOUDINARY_FOLDER` | No | Root folder prefix (default `wilms`) |
| `DATABASE_URL` | Production recommended | Upload metadata persisted to `uploads` table |

---

## Environment profiles

### Local development (default)

```env
UPLOAD_PROVIDER=local
WILMS_UPLOAD_DIR=.wilms-uploads
```

Files are stored on disk under `.wilms-uploads`. Metadata is in-memory unless `DATABASE_URL` is set.

### Local development with Cloudinary

Copy `apps/backend/.env.local.example` → `apps/backend/.env.local` and uncomment:

```env
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLOUDINARY_FOLDER=wilms-dev
```

### Staging

```env
NODE_ENV=production
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_FOLDER=wilms-staging
DATABASE_URL=<neon-staging-url>
```

### Production

See `apps/backend/.env.production.example`:

```env
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_FOLDER=wilms-prod
```

---

## Verify configuration

```bash
npm run cert:upload:env -w @wilms/api
```

Expected when Cloudinary is correctly configured:

- `active_provider: cloudinary`
- `cloudinary_configured: true`
- `valid: PASS`
- Secrets are **masked** in output (never printed in full)

---

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/uploads` | Upload via base64 `dataUrl` (auth required) |
| `GET` | `/uploads/:id` | Fetch upload metadata |
| `GET` | `/uploads/:id/content` | Local proxy or redirect to Cloudinary CDN |
| `POST` | `/uploads/:id/delete` | Delete blob + soft-delete metadata |
| `GET` | `/uploads/signature` | Signed direct-upload params (Cloudinary only) |

---

## Upload flows covered

| Flow | Frontend component | Purpose constant |
|------|-------------------|------------------|
| Borrower photo | `BorrowerRegistrationWizard` | `borrower-photo` |
| Guarantor photo | `BorrowerRegistrationWizard` | `guarantor-photo` |
| Registration attachment | `BorrowerRegistrationWizard` | `registration-attachment` |
| Staff profile photo | `RoleSettingsPanel` | `profile-photo` |
| Identity signature | `IdentityCaptureField`, `SignatureUploadField` | `signature` |
| Thumbprint | `IdentityCaptureField` | `thumbprint` |
| Documents | `DocumentUpload`, `CollectorExpenseForm` | `document` |
| General photos | `PhotoUpload` | configurable `uploadPurpose` |

Development uses mock upload service (`index.development.ts`). Production API mode calls backend `/uploads`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Upload provider: local` in production logs | Missing Cloudinary env vars | Set all three `CLOUDINARY_*` credentials |
| `valid: FAIL` from `cert:upload:env` | Incomplete production config | Fill missing variables; re-run cert script |
| `Cloudinary is not configured` on `/uploads/signature` | Provider is `local` or creds missing | Set `UPLOAD_PROVIDER=cloudinary` + credentials |
| Upload works but image 404 after restart (local, no DB) | In-memory metadata lost | Set `DATABASE_URL` for persistent metadata |
| `File exceeds maximum size` | File over `UPLOAD_MAX_SIZE_BYTES` | Increase limit or compress file |
| `Mime type ... is not allowed` | Type not in allow list | Add to `UPLOAD_ALLOWED_MIME_TYPES` |

---

## Security

- **Never** commit `CLOUDINARY_API_SECRET` to Git
- **Never** add `CLOUDINARY_API_SECRET` to frontend env files
- `GET /uploads/signature` returns `apiKey` + `signature` only (standard Cloudinary signed-upload pattern)
- `cert:upload:env` masks credential values in console output
- All upload routes require authentication (`requireAuth`)

---

## Developer action required

When implementation is ready, manually insert your Cloudinary credentials into:

1. `apps/backend/.env.local` (local testing)
2. Deployment platform secrets (staging/production)

Do not paste secrets into chat, PR descriptions, or documentation.

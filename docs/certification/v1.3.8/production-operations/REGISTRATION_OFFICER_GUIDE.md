# Registration Officer Guide — WILMS v1.3.8

**Role:** Registration Officer  
**Portal:** Registration  
**Primary permissions:** `access-registration-portal`, `register-borrowers`, `edit-borrowers`, `edit-pending-registrations`, `capture-documents`, `upload-signatures`, `gps-verification`

## 1. Responsibilities

- Complete borrower registration (7-step wizard)
- Capture documents, photos, signatures
- Edit pending registrations before approval
- Verify GPS / location data where required
- Hand off to approver for loan decisions

**Not permitted:** Loan approval, payment recording, user management, admin settings.

## 2. Registration wizard (7 steps)

Typical flow:

1. **Personal details** — name, contact, ID
2. **Location** — Ghana regions/districts (DB-backed locations)
3. **Group / association** — assign to group
4. **Documents** — ID scan, supporting docs
5. **Photo** — passport photo (upload, webcam, or phone capture)
6. **Signature** — borrower signature capture
7. **Review & submit** — validation summary

Save progress along the way. Pending registrations editable via `?edit=` query on registration routes.

## 3. Document and photo capture

| Method | Use case |
|--------|----------|
| File upload | Desktop scanner / gallery |
| Webcam | In-browser capture |
| Phone capture (QR) | Officer desktop shows QR → borrower phone uploads |

**Phone capture:** Public API routes are token-gated (no session on mobile). Must not return 401 — verified in deploy smoke.

**Low data mode:** Compresses images before upload (field connectivity).

## 4. GPS verification

When enabled, registration may require GPS coordinates. Denial may block submission per org policy.

## 5. After submission

- Registration enters **pending** state
- **Approver** reviews application (`review-applications`, `approve-borrowers`)
- Officer may edit pending items until approved
- Blacklisted borrowers cannot register or act as guarantor

## 6. Edit existing registration

Load registration with edit parameter (e.g. `?edit=<id>`). Console should be error-free after load (deploy smoke criterion).

## 7. Troubleshooting

| Issue | Action |
|-------|--------|
| Upload fails | Check file size/MIME; verify Cloudinary configured (ops) |
| Phone capture 401 | Escalate — BFF/proxy regression |
| Location not found | Verify `0012_ghana_locations` seed/migration applied |
| Cannot edit approved record | Expected — contact Super Admin for adjustment path |

## 8. Related docs

- [mobile-guide.md](../../../mobile-guide.md)
- [page-validation/RC1.4-photo-capture.md](../../../page-validation/RC1.4-photo-capture.md)
- [permission-matrix.md](../../../permission-matrix.md)
- [APPROVER_GUIDE.md](./APPROVER_GUIDE.md)

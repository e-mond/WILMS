# Collector Guide — WILMS v1.3.8

**Role:** Collector  
**Portal:** Collector (field-optimized PWA)  
**Primary permissions:** `access-collector-portal`, `record-collections`, `view-assigned-borrowers`, `register-borrowers` (limited), `record-expenses`, `capture-documents`

## 1. Responsibilities

- Record weekly loan repayments for assigned borrowers
- Record field expenses with receipts
- Support borrower registration (capture) when delegated
- Maintain field device health (PWA, offline queue, GPS)

**Not permitted (v1.3.8):** `manage-groups` — group management is Super Admin only.

## 2. Getting started

### Install PWA

- **Android / Chrome:** Install banner or menu → Install app
- **iOS:** Share → Add to Home Screen
- `start_url`: `/collector/dashboard`

After production deploy, **hard refresh** or reinstall to pick up service worker updates.

### Login

- Use organization-issued credentials (not `@wilms.demo` in production)
- Optional app lock PIN after idle timeout (device-local)

## 3. Core workflows

### Record payment

1. **Payment** tab → select borrower
2. Enter **full weekly amount** (partial payments not allowed)
3. GPS captured when verification enabled — denial may block submit
4. Confirm — payment clears oldest unpaid obligation first
5. Print/share receipt via browser print or Web Share

**Rules:**

- No advance payments — current week + arrears only
- Overpayment blocked and flagged for review
- Duplicate same borrower + date + amount blocked

### Same-day edits

Edits allowed same day only; locked after payment day ends (org policy).

### Expenses

1. Record expense with receipt photo
2. Submit for approval per org workflow

### My Borrowers

View assigned borrowers only — not global portfolio.

## 4. Offline operation

| Feature | Behavior |
|---------|----------|
| Offline shell | App shell loads from service worker cache |
| Payment queue | Queued in IndexedDB; syncs when online |
| Sync path | `/sync/offline/batch` → approver review at `/approver/sync-conflicts` |
| Financial posting | **Not** auto-applied offline — approver must approve |

Battery saver may pause background sync.

## 5. Mobile capture

Registration officers may generate QR for photo capture. Collectors may assist with document capture per permission.

See [mobile-guide.md](../../../mobile-guide.md).

## 6. Device settings

**Settings → Device:** battery, storage, upload queue status.

## 7. Troubleshooting

| Issue | Action |
|-------|--------|
| Payment won't submit | Check GPS; verify full amount; check connectivity |
| Offline queue stuck | Go online; check Device panel; contact support if pending &gt; 24h |
| App outdated after deploy | Hard refresh or reinstall PWA |
| 403 permission error | Contact Super Admin — role scope |

## 8. Related docs

- [mobile-guide.md](../../../mobile-guide.md)
- [offline-architecture.md](../../../offline-architecture.md)
- [device-management.md](../../../device-management.md)
- [PRODUCTION_SUPPORT_MANUAL.md](./PRODUCTION_SUPPORT_MANUAL.md)

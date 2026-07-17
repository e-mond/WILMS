# Approver Guide — WILMS v1.3.8

**Role:** Approver  
**Portal:** Approver  
**Primary permissions:** `access-approver-portal`, `review-applications`, `approve-borrowers`, `approve-loans`, `reject-loans`, `review-risk-flags`

## 1. Responsibilities

- Review and approve/reject borrower registrations
- Approve or reject loan applications
- Review risk flags
- Resolve **offline sync conflicts** before financial mutations post
- Export decision documents (PDF) where applicable

**Not permitted:** User management, system settings, admin reconciliation mutation, collector payment entry.

## 2. Application review

| Step | Action |
|------|--------|
| 1 | Open pending applications queue |
| 2 | Review registration data, documents, GPS |
| 3 | Check risk flags and blacklist status |
| 4 | Approve or reject with reason |
| 5 | Export PDF record if required |

Approved borrowers proceed to loan workflow. Rejected applications notify relevant parties per notification preferences.

## 3. Loan approval

| Step | Action |
|------|--------|
| 1 | Review loan terms, pool allocation, admin fee |
| 2 | Confirm admin fee acknowledged before disbursement |
| 3 | Approve or reject |
| 4 | Disbursement posts to ledger per system rules |

**SoD:** Approver does not record field payments or edit registrations post-approval without officer workflow.

## 4. Offline sync conflicts

**Critical for field operations (v1.3.8):**

- Collectors may queue payments offline
- Batches ingest via `/sync/offline/batch` but **do not auto-post**
- Approver reviews at **`/approver/sync-conflicts`**
- Approve or reject each conflict before balances update

This prevents unauthorized financial writes from compromised or stale offline data.

## 5. Risk flags

Review flagged borrowers/loans with `review-risk-flags` permission. Coordinate with Super Admin on escalations.

## 6. Notifications

Approvers receive in-app (and optional email/SMS) for:

- New applications pending review
- Offline sync conflicts requiring action
- Loan decisions (per preferences)

## 7. Troubleshooting

| Issue | Action |
|-------|--------|
| Cannot see application | Verify officer submitted; check status |
| Sync conflict list empty but collector reports queue | Check API connectivity; escalate if ingest failed |
| Export PDF fails | Try alternate browser; escalate with `requestId` |
| 403 on reconciliation | Expected — auditors and approvers lack admin portal |

## 8. Related docs

- [offline-architecture.md](../../../offline-architecture.md)
- [synchronization-guide.md](../../../synchronization-guide.md)
- [REGISTRATION_OFFICER_GUIDE.md](./REGISTRATION_OFFICER_GUIDE.md)
- [permission-matrix.md](../../../permission-matrix.md)

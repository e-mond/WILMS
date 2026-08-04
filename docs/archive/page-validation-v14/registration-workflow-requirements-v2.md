# Registration & Review Workflow Requirements (v2)

Recorded: 2026-06-09. Apply before RBAC enforcement.

## 1. Signatures / Thumbprints (Optional Digital)

- Borrower signature, borrower thumbprint, guarantor signature, guarantor thumbprint are **optional** during digital registration.
- Registration may complete without them.
- Printed/PDF agreement must show clearly marked signature and thumbprint areas for borrower, guarantor, and officer plus date lines for manual signing after print.

## 2. Image Capture Workflow

- **All devices** (including laptops with webcams) show **Take Photo** and **Capture Using Mobile**.
- Mobile capture flow: officer clicks Capture Using Mobile → QR + session token + secure URL → borrower scans → mobile camera → upload to session → preview auto-updates.
- Preferred workflow when mobile camera quality exceeds laptop webcams.

## 3. Profile Photos Everywhere

- Every person record displays an image/avatar (borrowers, collectors, staff, group leaders/members, notifications, audit).
- Fallback avatar when image unavailable; no text-only identity where photos are expected.

## 4. Loan Amount Removal From Registration Agreement

- Registration agreement must **not** contain loan amount information.
- Registration establishes identity, eligibility, group membership, guarantor relationship, program acceptance only.

## 5. Registration Review / Print Layout

Physical form reference structure:

- Header: passport photo, program name, form title, instruction text, program declaration
- Applicant information (personal fields)
- Work / business information
- Guarantor information
- Guarantor declaration (configurable) + signature/date placeholders
- Borrower declaration (configurable) + signature/date placeholders
- Key terms & enforcement (Super Admin configurable)
- Legal notice (Super Admin configurable)

Review screen must resemble an official printable document, not a raw form dump.

## 6. Role-Based Settings Pages

Every role has a Settings page with role-appropriate sections (Super Admin, Collector, Registration Officer, Approver, Auditor).

## 7. Mandatory App Lock (All Roles)

- First login: create 6-digit PIN (or biometrics where supported).
- Return from background/timeout: "Welcome back" + PIN entry (not full login).

## 8. Super Admin Settings Cleanup

- Remove Export, Download, Save PDF from Settings.
- Exports belong in Reports, Audit Logs, dedicated export actions.

## Validation Checklist (Pre-RBAC)

- [x] Registration document template updated
- [x] Review screen updated
- [x] Print layout updated (via export document builder)
- [x] PDF layout updated (via export document builder)
- [x] Photo display added across primary person surfaces
- [x] Role settings pages added
- [x] Export actions removed from Settings
- [x] Legal text from configuration, not hardcoded strings

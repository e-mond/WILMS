# P11i Group Automation Audit

## Automated formation
- Approved borrowers queue per community in `group-formation.store.ts`.
- When count reaches `minGroupSize`, a group is created with immutable `groupSystemId` (`[Community]-[Month]-[Sequence]`) and editable `displayName`.
- Trigger wired from `borrowerService.mock.ts` on `approveBorrower`.

## Settings
- `minGroupSize` / `maxGroupSize` defaults (5 / 10) in `MOCK_SYSTEM_SETTINGS`.
- Super Admin can edit limits via Settings ÔåÆ Loan Rules (`updateSettings` service + store).
- Other roles see read-only values sourced from settings service.

## Membership rules
- `groupService.mock.ts` enforces max size on add and min size on remove/validation.
- Leader permissions via `group-leader-permissions.ts`, wired in `GroupMembershipManagement`.

## Approval dashboard
- Pending applications grouped by community and registration date in `PendingApplicationsQueue`.

## Tests
- `group-system-id.test.ts`, `group-leader-permissions.test.ts`, formation store covered indirectly via borrower approval flow.

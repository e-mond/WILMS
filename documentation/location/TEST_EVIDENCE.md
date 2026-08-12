# Location Master Test Evidence

**Product version:** 1.8.0  
**Date:** 12 August 2026  
**Language:** British English

## Commands executed

| Command | Result |
|---------|--------|
| `npm run type-check -w @wilms/domain` | Pass |
| `npm run type-check -w @wilms/frontend` | Pass |
| `npm run test -w @wilms/domain -- src/tests/locations/location-master.test.ts` | Pass (2 tests) |
| `npx vitest run src/tests/borrower-registration/registration.schema.test.ts src/tests/services/locationService.mock.test.ts` | Pass (9 tests) |
| `npm run lint -w @wilms/frontend -- --max-warnings=0` | Pass |
| `npm run build -w @wilms/frontend` | Pass |
| `npm run db:apply:location-master -w @wilms/domain` | Pass |
| `WILMS_CONFIRM_DB_RESET=YES npm run db:reset:keep-users -w @wilms/domain` | Pass |
| `npm run seed:location-master -w @wilms/domain` | Pass |
| `npm run verify:migrations -w @wilms/domain` | Pass (`READY`) |

## Import counts

| Entity | Rows imported |
|--------|----------------|
| Regions | 16 |
| Districts | 48 |
| Communities | 144 |
| Dataset source | `geoBoundaries` |
| Dataset version | `2026-07-04` |

## Database reset

Transactional tables were truncated while preserving:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_permission_overrides`
- `__drizzle_migrations`

## Remaining verification notes

- Full frontend `npm run test` suite was not re-run in full; targeted location and registration tests plus type-check, lint, and production build passed.
- District/community coverage remains a representative subset until a full national GSS/geoBoundaries load is supplied.

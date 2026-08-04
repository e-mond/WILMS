# DEPENDENCY REPORT — WILMS

**Audit date:** 2026-07-16  
**Audited code:** `main @ 10dfcbb`

## 1. Dependency manifests (observed)

### Root (`/workspace/package.json`)
- Monorepo scripts + tooling
- Dev dependency: `vitest@3.2.6`

### Frontend (`apps/frontend/package.json`)
Notable dependencies:
- `next@^14.2.35`
- `react@18.3.1`, `react-dom@18.3.1`
- `framer-motion@^11.11.17`
- Export/report libs: `exceljs`, `jspdf`, `jspdf-autotable`, `docx`
- UI/validation: `lucide-react`, `react-hook-form`, `zod`, `zustand`
- Mail client dependency: `nodemailer@^9.0.3` (verify scope: client vs server usage)

### Backend (`apps/backend/package.json`)
Notable dependencies:
- `express@4.21.2`, `helmet@8.2.0`, `cors@2.8.5`
- `express-rate-limit@8.5.2`
- `drizzle-orm@^0.38.4`, `drizzle-kit@^0.30.5`
- Upload: `cloudinary@^2.10.0`
- Security/auth: `bcrypt`, `cookie-parser`, `ws`, `uuidv7`

## 2. Vulnerabilities (from `npm audit --production`)

`npm audit --production` reported **8 vulnerabilities**:
- **High**:
  - `drizzle-orm` advisory: “SQL injection via improperly escaped SQL identifiers”
  - Multiple `next` advisories (server component related)
  - `playwright` SSL authenticity advisory (test/dev risk signal)
- **Moderate**:
  - `postcss` XSS via unescaped `</style>` in CSS stringify output
  - `uuid` missing buffer bounds check (transitive via exceljs)

**Fix availability:** audit output indicates fixes often require **breaking** upgrades (audit suggests `--force` and specific major versions).

## 3. Recommended dependency action plan (no auto-changes in this audit)

To keep production stable, apply upgrades in a dedicated sequence:
1. Create a dependency-hardening PR (document breaking changes).
2. Upgrade the highest-impact component(s) first:
   - Next (security advisories)
   - drizzle-orm (SQL injection advisory)
3. Run:
   - unit tests
   - build
   - production health smoke
4. Re-run `npm audit --production` and confirm advisories are gone.

## 4. Dependency hardening status

**Security-hardening changes in this audit:** XSS preview hardening (code), not dependency upgrades.  
**Dependency upgrade:** deferred pending operator-controlled upgrade window.


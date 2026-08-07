# WILMS Documentation Web Portal

**Version:** 1.7.3  
**Status:** Structure defined — deployment pending

---

## Purpose

This directory defines the structure for a future static documentation portal browsable by programme staff, partners, and evaluators. Content sources live in `documentation/` markdown files; this portal provides navigation, versioning, and search scaffolding.

---

## Planned features

| Feature | Description |
|---------|-------------|
| Sidebar navigation | Hierarchical nav from `nav.json` |
| Version selector | Switch between v1.7.2, v1.7.3, etc. |
| Full-text search | Client-side search index |
| FAQ section | Common questions per role |
| Glossary | Terms from Product Book appendix |
| Dark mode | Match application theme tokens |
| Mobile responsive | Readable on field devices |

---

## Directory structure

```
documentation/web/
├── README.md          — this file
├── nav.json           — navigation tree
├── index.html         — (future) portal entry point
├── assets/            — (future) CSS, JS, search index
└── versions/          — (future) versioned content snapshots
```

---

## Navigation

Navigation tree defined in `nav.json`. Categories:

1. Getting Started
2. Product Books
3. Technical
4. User Guides
5. Operations
6. Roadmap
7. Branding

---

## Versioning strategy

- Each release tags documentation snapshot
- Current version: 1.7.3
- Platform features documented through: 1.7.2
- Version selector shows release notes delta

---

## FAQ (planned)

**Q: Where did Export Center go?**  
A: Removed in v1.7.3. Use contextual export buttons on report pages, borrower profiles, and executive intelligence.

**Q: How do I generate PDF manuals?**  
A: Run `npm run docs:generate` from repository root.

**Q: What roles exist?**  
A: Super Admin, Registration Officer, Collector, Approver, Auditor.

**Q: Is WILMS a general ledger?**  
A: No. Operational pool ledger only. Statutory GL planned v2.0.

---

## Glossary (excerpt)

See Product Book Appendix A for full glossary. Key terms: pesewas, pool, maker-checker, SoD, RBAC, contextual export.

---

## Deployment options (future)

1. **Static site** — Vercel/Netlify deploy from generated HTML
2. **Docs framework** — Docusaurus, Nextra, or Mintlify consuming markdown
3. **In-app help** — Link from WILMS navbar to hosted portal

---

## Build integration (future)

```bash
npm run docs:generate    # PDF/DOCX
npm run docs:web-build   # (future) Static site generation
```

---

*Structure reference for v1.7.3 — portal deployment planned v1.8.*

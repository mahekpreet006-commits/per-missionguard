# PermissionGuard

**Mobile App Permission & Privacy Risk Analyzer** — a real, rule-based tool that
scores the privacy/security risk of a mobile app from its Android-style
permissions. It is not a quiz or a static demo: every score, verdict and warning
is computed by the backend risk engine from the permissions you submit.

## Features

- **Two analysis modes**
  - *Manual* — pick permissions from grouped, categorized cards.
  - *Manifest / Permission list* — paste raw manifest text or a permission list;
    the backend extracts, normalizes and de-duplicates it.
- **Real rule-based risk engine** — weighted per-permission scoring, capability
  detection (personal data, surveillance, location, device control,
  communication) and dangerous-combination rules (spyware, banking trojan,
  device takeover, data harvesting, etc.).
- **Risk classification** — Low / Moderate / High / Critical.
- **Detailed report** — score gauge, verdict badge, detected permissions, risk
  categories, dangerous combinations, a category pie chart and analyst
  recommendations.
- **Permission dictionary** — searchable knowledge base for every permission.
- **Saved reports + dashboard** — persist analyses and view live stats (total
  scans, high/critical counts, most common dangerous permission). All values
  come from the database.
- **Copy / share** report summaries.

## Tech stack

- **Frontend:** React 19 + TanStack Start (file-based routing) + Tailwind CSS v4
- **Backend:** TanStack server functions (`createServerFn`) — app-internal RPC
- **Database:** Lovable Cloud (Postgres) with row-level security

## How the risk engine works

- `src/lib/permissions.ts` — the permission dictionary (single source of truth:
  scores, risk levels, descriptions, aliases, manifest parsing/normalization).
- `src/lib/risk-engine.ts` — pure, deterministic analysis: per-permission
  scoring, capability categories, dangerous combinations and verdict
  classification.
- `src/lib/analysis.functions.ts` — server functions `analyzeManual` /
  `analyzeManifest`.
- `src/lib/reports.functions.ts` — server functions to save/list/get/delete
  reports and compute dashboard stats. Scores are **recomputed server-side**
  before saving, so stored data is always real engine output.

### Score ranges

| Score | Verdict |
| ----- | ------- |
| 0–20  | Low |
| 21–45 | Moderate |
| 46–75 | High |
| 76+   | Critical |

## Public API

- `GET /api/public/permissions` — supported permission definitions and risk data.
- `GET /sitemap.xml`

## Routes

- `/` — home with both analysis modes and recent reports
- `/manual` — manual permission selection
- `/manifest` — manifest / permission list analysis
- `/result` — generated report (with Save)
- `/report/$id` — a saved report
- `/dashboard` — reports dashboard with search, filters and stats
- `/dictionary` — permission knowledge base

## Local development

```bash
npm install
npm run dev
```

The database and environment are provisioned automatically by Lovable Cloud.

> Educational tool. It analyzes permission **lists/manifest text** — it does not
> decompile or reverse-engineer APKs.
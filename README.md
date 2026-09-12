# Partizip practice

Small HTML/CSS/TypeScript app served by one Cloudflare Worker with D1. No frontend framework, ORM, runtime packages, or paid external services.

## Structure

- `src/data/verbs.ts`: source-controlled vocabulary and classifications.
- `src/worker/`: same-origin API, server-side grading and parameterized D1 queries.
- `src/client/`, `public/`: two accessible frontend pages and compiled browser JS.
- `migrations/`: versioned SQLite schema.
- `tests/`: grading and vocabulary checks.

## Initial decisions

German infinitive → Partizip II, with anonymous per-browser history. Editorial importance tiers: essential, common, extended. The vocabulary contains 110 verbs: 15 regular and 15 irregular in Essential (Tier 1), 20 regular and 20 irregular in Common (Tier 2), and 20 regular and 20 irregular in Extended (Tier 3). These are learning groups, not strict frequency rankings; several Tier 2 verbs are also extremely frequent. `teilnahmen` is corrected to `teilnehmen`. `werden` means “become” here, so the expected participle is `geworden`; passive-auxiliary `worden` is outside this exercise.

## Local development

On this Windows machine, enable the bundled Node.js and pnpm in each new PowerShell window:

```powershell
cd "$env:USERPROFILE\OneDrive\Documents\ChatGPT\partizip2"
.\powershell_setup.ps1
pnpm dev
```

The setup script updates only the current terminal's PATH, works when run repeatedly, and does not install software or change your PowerShell profile. It uses the runtime bundled on this machine; other machines can install the tools below normally.

Install Node.js 22.18+ (Node 24 LTS recommended) and pnpm. The machine's default Node 14 is too old for current Wrangler. There are only three development dependencies: TypeScript, Wrangler, and Cloudflare's type definitions. The lockfile pins transitive dependencies; no application runtime packages.

```sh
pnpm install --frozen-lockfile
pnpm db:local
pnpm build
pnpm exec wrangler dev
```

Open the URL Wrangler prints (normally http://localhost:8787). For frontend changes, run `pnpm exec tsc -p tsconfig.client.json --watch` in another terminal. Worker changes are watched by Wrangler. `pnpm dev` builds once and starts Wrangler. Local D1 persists under ignored `.wrangler/state`; it never uses the production database. Migrations are repeatable through Wrangler's migration tracking.

```sh
pnpm check
pnpm test
pnpm build
pnpm exec wrangler deploy --dry-run --outdir dist
```

With the local server running, `node tests/integration.mjs` checks real D1 persistence, grading, idempotent retries, browser isolation, filters, validation and static routes. It creates three local test attempts under a fresh anonymous identity, so they do not appear in your browser's history.

Initial validation passed: separate browser/Worker type checks, three grading and vocabulary tests, local migration, HTTP/D1 integration checks, and Wrangler's deployment dry run. Responsive CSS and semantic keyboard controls are implemented; visual browser/device testing has not yet been performed.

## Data and grading

Edit `src/data/verbs.ts` to add words, keeping IDs stable. Vocabulary is bundled into the Worker, not stored as a database word list. The API omits the expected participle until the answer is submitted. An attempt snapshots tier, type and expected answer, so changing vocabulary does not rewrite history. Subtypes are weak, strong, mixed and suppletive; separability is an independent property. Strong/mixed/suppletive verbs belong under irregular; weak verbs under regular.

The server grades a normalized copy (Unicode NFC, trimmed, lowercase) but stores the original answer. Exactly one character insertion, deletion, substitution or adjacent transposition is a typo. Multiple differences are wrong. Keyboard alternatives `ae`, `oe`, and `ue` are accepted for expected `ä`, `ö`, and `ü` in both grading and the correction step. Original input is preserved in history; the displayed solution keeps German spelling. Previously recorded results are not regraded. No fuzzy dictionary or paid translation service. Accuracy means correct / all attempts; typos remain separate.

Timestamps are server receipt times in UTC ISO 8601 with milliseconds, not claims of clock precision. The history renders local time with milliseconds and exposes UTC in the timestamp tooltip. Pagination shows 50 answers per page; summary covers all matching attempts. Indexed learner lookup avoids scanning other learners, but lifetime summaries still read that learner's history. Consider aggregate tables if usage grows.

Anonymous identity uses a random HttpOnly, SameSite=Strict cookie (Secure in production), retained for one year. Clearing it loses access to that history; there is no login, recovery or cross-device sync. Answers are retained in D1 indefinitely in this version. Do not put personal information into answers. All writes require a matching Origin, JSON content type and bounded input. SQL values are bound parameters. The attempt UUID makes retries idempotent. These are personal practice records, not tamper-proof exam results. For an open public launch, consider edge rate limiting and a history deletion/recovery feature; quotas still apply to malicious traffic.

## Production deployment

The project is deployment-ready after account setup, but no Cloudflare account resources are created automatically. Never replace the local binding with a remote production binding.

1. Authenticate: `pnpm exec wrangler login`.
2. Create the production database: `pnpm exec wrangler d1 create partizip-production`.
3. Copy the returned database ID into **only** `env.production.d1_databases[0].database_id` in `wrangler.jsonc`. Database IDs are configuration, not credentials. The placeholder intentionally prevents an unconfigured production deployment.
4. Apply production migrations: `pnpm db:production` (explicit `--remote --env production`). Review SQL first and take a D1 export before future destructive migrations.
5. Run checks above, then `pnpm deploy`. It deploys frontend assets and API together to the Worker's `workers.dev` domain. No custom domain required.
6. Confirm a practice answer appears in progress, reload to confirm persistence, and verify a separate browser has separate history.

Wrangler credentials and local state are ignored by Git. Commit source, migrations and `pnpm-lock.yaml`; create a GitHub repository and push when ready. There is no automatic deployment pipeline or secret committed to the repository. Keep migrations additive when possible; rolling back Worker code does not undo database migrations.

## Free tier and costs — checked 2026-09-10

| Resource | Published free allowance |
| --- | --- |
| Worker invocations | 100,000/day, 10 ms CPU per invocation |
| Static assets | Free unlimited requests; up to 20,000 files/version, 25 MiB/file |
| D1 rows read | 5 million/day |
| D1 rows written | 100,000/day; index updates also count |
| D1 storage | 5 GB/account, 500 MB per database; up to 10 databases |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/). Recheck these immediately before production deployment and inspect your account's shared consumption.

This version requires no paid service within these limits. Free quota exhaustion causes failures rather than automatic paid overages. An optional custom domain costs registration fees. Opting into Workers Paid has a $5/month minimum plus applicable usage charges; do not enable it merely to run this app. No analytics vendor, hosted fonts, scheduled job, AI API, external database or subscription is required.

## Progress graphs

The Progress page shows a trailing 10-answer accuracy curve for the latest lesson. A gap of at least 4 hours between saved attempts starts a new lesson, detected before tier/type filtering. The first nine points are hidden with the default period of 10; the latest 500 points are displayed for very long lessons. The lesson chart offers SMA or EMA with an editable period from 1 to 100 (default 10). Both start at the first complete period. EMA starts with that period’s mean and then uses alpha = 2/(N+1). Smoothing uses the full lesson, with only the latest 500 complete points drawn. Daily smoothing defaults to none; a seven-calendar-day moving average is optional.

The daily graph shows 90 UTC calendar days of individual daily accuracy by default. The Daily smoothing selector optionally enables trailing seven-day accuracy, weighted by answer count. Six extra days are fetched to calculate the first visible point. No-practice days add neither successes nor failures; a window with no attempts has no value. Plots award 1 point for correct answers, 0.5 for typos and 0 for wrong answers, and correction exercises are never included. Existing attempts work without a migration. Different tiers and practice mixes can affect accuracy, so this is practice feedback rather than a controlled proficiency measurement.

Charts use native SVG with expandable data tables, no added packages. Use Refresh progress after practicing in another tab; returning to a visible Progress tab also reloads its data. Daily queries read only the last 96 days; lesson detection currently reads the learner's lifetime history (consider explicit session IDs if history grows very large).

## Common-errors practice

The Common errors tab selects up to 20 verbs from each learner's last five normal answers per verb, ranked by lost points (wrong = 1, typo = 0.5). A verb needs at least one lost point to qualify. Targeted answers are saved with `practice_mode = 'errors'`; correction retyping remains unlogged. The set updates on page load and does not use targeted attempts as evidence. Five correct normal answers retire an old error from the set.

Apply migration `0002_practice_mode.sql` locally with `pnpm db:local` and in production with `pnpm db:production` before deploying. Existing attempts default to normal practice. Progress defaults to normal-only for history, totals and both graphs; use Practice included to see targeted-only or all attempts. Lesson boundaries are calculated within the chosen mode, before tier/type filters.

Common-errors practice displays the canonical participle by default for copying. Select “Hide the answer for recall practice” to conceal it; the choice lasts for the current page visit. The answer field remains empty so the learner must type it. Normal practice still withholds the answer until submission.

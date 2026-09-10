# Partizip practice

Small HTML/CSS/TypeScript app served by one Cloudflare Worker with D1. No frontend framework, ORM, runtime packages, or paid external services.

## Structure

- `src/data/verbs.ts`: source-controlled vocabulary and classifications.
- `src/worker/`: same-origin API, server-side grading and parameterized D1 queries.
- `src/client/`, `public/`: two accessible frontend pages and compiled browser JS.
- `migrations/`: versioned SQLite schema.
- `tests/`: grading and vocabulary checks.

## Initial decisions

German infinitive → Partizip II, with anonymous per-browser history. Editorial importance tiers: essential, common, extended. All initial entries are irregular. `teilnahmen` is corrected to `teilnehmen`. `werden` means “become” here, so the expected participle is `geworden`; passive-auxiliary `worden` is outside this exercise.

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

The server grades a normalized copy (Unicode NFC, trimmed, lowercase) but stores the original answer. Exactly one character insertion, deletion, substitution or adjacent transposition is a typo. Multiple differences are wrong. Umlauts are meaningful; `ae` is not silently converted to `ä`. No fuzzy dictionary or paid translation service. Accuracy means correct / all attempts; typos remain separate.

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

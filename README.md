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

## Answer explanations

Every verb has a short English learning note in `src/data/explanations.ts`, attached to the vocabulary entry. Regular notes show the actual stem/prefix/ending breakdown; irregular notes highlight vowel changes, spelling, or contrasts with related verbs. Notes appear after a saved answer in both modes, stay visible while retyping a correction, and clear on the next word. Prompt endpoints withhold explanations so they do not reveal the answer prematurely. These are editorial content, not database records; no migration is required.

The notes are general learning aids, informed by recurring error patterns rather than personalized claims. Raw production answers and frequencies are not stored in this repository. Grammar references: [Goethe-Institut A1 grammar overview](https://lernen.goethe.de/deutschonline/A1/PDF/DE/deutschonline_Redemittel_und_Grammatik_1-18.pdf), [Lingolia: Partizip I und II](https://deutsch.lingolia.com/de/grammatik/verben/partizipien), and [Duden: liegen](https://www.duden.de/rechtschreibung/liegen_lehnen_ruhen).

## Development workflow

Work on `dev`, commit verified changes and push to `origin/dev`. Do not merge into `master` or deploy without an explicit request.

## Vocabulary classification audit

Reviewed all 110 entries and their notes on 2026-09-13: 55 regular (weak) and 55 irregular. After a saved answer, the explanation heading explicitly shows Regular or Irregular, with the subtype and separability, in both modes. These hints stay hidden before submission, remain visible during correction, and reset for the next word. Classification describes the verb's conjugation, not just a vowel change in its participle. Mixed verbs (bringen, denken, kennen, rennen and mitbringen) count as irregular despite ending in -t. Strong is the broad teaching category, including exceptional forms such as gehen, stehen and tun; sein is marked suppletive. The subtype is a learning aid, not a complete historical classification.

The audit checked weak stem/ending breakdowns, strong and mixed forms, prefix placement, and meaning-dependent separability. In particular, vorbereiten is separable yet has no added ge-; wiederholen (repeat), übersetzen (translate) and unterschreiben (sign) are inseparable. Werden uses geworden for “become”, rather than passive worden. Existing type classifications and stored progress remain valid; no database migration is needed.

References: [Deutschkurse Passau, strong and mixed verb tables (pages 6–7)](https://deutschkurse-passau.de/JM/images/stories/LISTEN/listen-tabellen_a1-a2.pdf), [Lingolia, verb categories](https://deutsch.lingolia.com/en/grammar/verbs), [Duden, tun](https://www.duden.de/rechtschreibung/tun_handeln), and [Duden, vorbereiten](https://www.duden.de/rechtschreibung/vorbereiten). The explanation comparisons describe individual forms; they are not universal sound-change rules.

## Articles & cases

The independent noun exercise is at `/articles.html`, with its own report at `/articles-progress.html`. Each round starts by checking gender in the nominative, then asks for the definite article in accusative, dative and genitive sentences. A wrong choice must be corrected before advancing. Only the first answer is saved; corrections are unlogged. Failed requests retry the original choice and attempt ID. Rounds do not currently resume after reloading.

Content lives in `src/features/articles/nouns.ts`: 30 essential singular nouns (10 per gender), each with three authored sentences, stable ID, tier and content version. Common and extended tiers are available for future content. Sentences supply any inflected noun endings; learners select only the article. The API, answer validation and reporting queries live in `src/features/articles/api.ts`; the browser flow and report are `src/client/articles.ts` and `articles-progress.ts`. Only the existing HTTP helper, cookie identity, styles and SVG renderer are shared with Partizip II. No generic exercise engine or runtime dependencies were added.

`0003_articles.sql` creates a separate `article_attempts` table with unique learner/round/question keys. Apply with `pnpm db:local` for local use. Before a future production deployment, apply `pnpm db:production`; this feature does not alter verb history. Reports show accuracy by question and daily accuracy for the last 90 UTC days, with tier and question filters. All article answers are currently standard practice. Article attempts never enter the Partizip reports.

Grammar reference: [Goethe-Institut, German grammar and case tables](https://www.goethe.de/ins/de/de/m/prf/grm.html). Tiers describe editorial importance, not measured corpus frequency. Content changes that affect answers should increment the noun's version. The server rejects stale versions and out-of-order questions; the browser handles unlogged correction gating.

### Article difficulty

Easy uses nominative → accusative → dative → genitive. Hard keeps nominative first and independently shuffles the remaining three cases each round; a random shuffle can occasionally match the easy order. In Hard mode, the three sentence case labels stay hidden until an answer is saved, then appear for both correct and wrong answers and remain during correction. The initial gender/nominative prompt and all Easy-mode case labels stay visible. Difficulty is locked once answering begins and stored separately from practice mode. The server requires nominative before any hard-mode case and rejects changing difficulty within a round.

Apply `0004_article_difficulty.sql` locally before testing and in production before the next deployment. Existing article attempts become Easy automatically. The article progress report defaults to Easy and offers Hard, with four separate daily charts (nominative/gender, accusative, dative, genitive). Tier and difficulty filters apply to both totals and graphs.

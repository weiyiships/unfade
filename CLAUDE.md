# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Unfade: Photo Restoration App

Web app where users upload old or damaged photos, restore them with an AI restoration API, compare before and after, and download the result. Account users also keep a history of past restorations. The PRD decides _what_ to build; this file decides _how_.

## Project references

Product requirements (imported so they are always in context):

@docs/PRD.md

- Scope and exclusions: PRD §3 Goals, §4 Non-goals
- What to build: PRD §6 User stories, §7 Functional requirements and acceptance criteria
- Quality bars: PRD §8 Non-functional requirements
- How the `/init` baseline was turned into this file: `docs/claude/init-iteration.md`
- Context management for long sessions: `docs/claude/context-management.md`

## Project status

The repo is at milestone 1 (setup): there is no application code yet. The commands below are the target `package.json` scripts. Create them during setup, and do not claim a command passed until it exists and you have run it.

## Commands

```bash
npm run dev            # Next.js dev server
npm run build          # production build
npm run lint           # ESLint
npm run format:check   # Prettier check (npm run format to fix)
npm run typecheck      # tsc --noEmit
npm test               # Vitest unit tests
npx vitest run src/lib/domain/restoration-options.test.ts   # one test file
npx vitest run -t "orders options"                          # tests by name
npm run test:e2e       # Playwright (uses the fake restoration provider)
npm run db:generate    # drizzle-kit generate (new migration from schema)
npm run db:migrate     # apply migrations to DATABASE_URL
npm run db:check       # fail if schema.ts and drizzle/ migrations disagree (runs in CI)
```

Definition of done for any task: `npm run lint && npm run format:check && npm run typecheck && npm test` passes.

## Technology stack

- **Framework:** Next.js 15+ App Router, React 19, TypeScript (`strict: true`)
- **UI:** Tailwind CSS 4 + shadcn/ui + lucide-react
- **AI restoration:** Replicate (default) or Gemini image editing, behind one provider interface
- **Image storage:** Vercel Blob, private access
- **Database:** Postgres (Neon via Vercel Marketplace) with Drizzle ORM and drizzle-kit migrations
- **Validation & auth:** Zod, `jose` (JWT cookies), bcryptjs (cost 12)
- **Testing:** Vitest + React Testing Library, Playwright
- **Deploy & CI:** Vercel, GitHub Actions

## Architecture decisions

These follow from the PRD and from platform limits. Change one only by updating this file in the same PR.

1. **Layering:** UI (`src/app`, `src/components`) → route handlers and server actions → `src/lib/*`. Business rules live only in pure functions in `src/lib/domain` (option ordering, job status transitions, upload validation rules). `src/lib/domain` imports nothing from Next.js, the database, or providers.
2. **Restoration provider adapter:** `src/lib/restoration/` defines a `RestorationProvider` interface (`start(job) → providerJobId`, `getStatus(providerJobId)`). Replicate, Gemini, and a `FakeProvider` implement it, and `RESTORATION_PROVIDER` picks one. Code outside this folder never imports a provider SDK. Replicate is the default; the Gemini evaluation (#7, PRD milestone 4) can switch it without changes outside this folder.
3. **Direct-to-Blob uploads:** uploads go from the browser straight to Vercel Blob with client upload tokens. Vercel Functions cap request bodies at 4.5 MB and the PRD allows 10 MB photos, so image bytes never pass through a function. The token route enforces type (JPEG, PNG, WebP) and size (10 MB).
4. **Async jobs + polling:** "Restore" creates a `restoration` row (`queued`) and starts the provider job. The client polls `GET /api/restorations/:id` every 2 to 3 seconds. That handler checks the provider, then moves the row through `queued → processing → succeeded | failed`. All transitions go through one `src/lib/domain` function. No WebSockets or queues in v1.
5. **Copy results into our storage:** provider output URLs are temporary. On success, copy the result into our private Blob store, save that URL, and never return a provider URL to the client.
6. **Fixed option pipeline:** combined options always run in the order restore → faces → colorize → upscale (PRD FR-3). Upscaling runs last so the slower models work on the smaller image.
7. **Private images:** images are served only through a route that checks ownership. Account users are identified by the auth JWT. Visitors get an anonymous signed session cookie that owns their uploads for 24 hours. A daily Vercel Cron job deletes visitor photos older than 24 hours from both Blob and Postgres.
8. **Secrets stay server-side:** provider, Blob, and DB credentials are read only in modules that start with `import "server-only"`.

## Coding conventions

- TypeScript strict. No `any`, `@ts-ignore`, non-null `!` on external data, or `console.log` (use the logger in `src/lib/log.ts`).
- Validate every external input (request bodies, params, provider responses, env) with Zod at the boundary. Share schemas between client and server from `src/lib/validation`.
- Files and folders in kebab-case; React components in PascalCase; named exports only (except Next.js route files).
- Server Components by default; add `"use client"` only for interactive pieces (upload dropzone, comparison slider, polling).
- Route handlers stay thin: parse → call `lib` → map the result to an HTTP response. Errors return `{ error: { code, message } }` with the correct status code.
- Database access only through `src/lib/db`. Schema changes go through drizzle-kit migrations; never edit an applied migration.
- UI is mobile-first at 375px with light and dark mode via theme tokens; don't ship stock shadcn/ui styling.
- Git: branch `<type>/<issue>-<description>` off `main`; Conventional Commits ending in the issue number, e.g. `feat(restoration): add replicate provider (#12)`.

## Testing strategy

- **Test-driven:** write the failing test first (red → green → refactor). A feature isn't done without tests.
- **Unit (Vitest):** colocated `*.test.ts(x)`. Cover `src/lib/domain` (option ordering, status transitions, file validation), Zod schemas, auth helpers, and components such as the comparison slider.
- **Provider adapters:** test against recorded or hand-written HTTP fixtures. **Tests never call a real AI provider.** Real calls cost money and are slow and nondeterministic.
- **Database and integration:** tests that touch Postgres use `setupTestDb()` from `src/lib/db/test-db.ts`. It runs PGlite (in-memory Postgres) with every committed migration applied, so constraints are tested against real Postgres with no network or `DATABASE_URL`. Route handler tests do the same, with `FakeProvider` and a stubbed Blob client. Assert database errors with `pgErrorCode()` and the `PG` codes in `src/lib/db/pg-error.ts`.
- **End-to-end (Playwright):** at 375px with `RESTORATION_PROVIDER=fake`, cover upload → restore → compare → download, signup and login → history → delete, and the error and retry paths. Include axe accessibility checks.
- **Coverage:** 70% overall in CI; aim for 95% on `src/lib/domain`.
- **Fixtures:** small sample photos in `tests/fixtures/` (under 200 KB each, no real people's family photos).
- Never skip, delete, or weaken a test to make CI pass.

## Do's

- Do check the PRD acceptance criteria for the story you're working on, and list them as a checklist in the PR.
- Do keep the provider choice behind the adapter, and add new restoration options there and in the domain pipeline order.
- Do show progress, error, and retry states for every restoration (PRD FR-2). Retry reuses the uploaded photo.
- Do rate-limit restoration and login endpoints server-side (PRD FR-2, FR-7).
- Do delete both the original and the restored Blob when a restoration or photo is deleted.
- Do ask before adding a new dependency, external service, or paid API.

## Don'ts

- Don't build PRD §4 non-goals: manual editing tools, our own models, batch or video processing, payments, public galleries or sharing feeds, social login.
- Don't send image bytes through a Vercel Function body, and don't expose provider URLs, Blob tokens, or API keys to the client.
- Don't call a real restoration API in tests, CI, or scripts. Use `FakeProvider` unless the user explicitly asks for a live run.
- Don't log image URLs, file names, emails, or passwords. Uploaded photos are personal family data.
- Don't use photos for anything except the user's own restoration (PRD §8), and don't commit real user photos.
- Don't use `export const runtime = "edge"`. Use the default Node.js runtime.
- Don't commit to `main`, force-push, merge or close PRs, or run production deploys or migrations unless a team member asks.

## Stick to the truth

- Don't feel you have to please me. Say no or contradict me if I'm wrong.
- Tell me when you don't know something or aren't confident instead of making things up.
- Base answers on evidence (code, docs, command output) unless I say otherwise. Check library APIs against installed docs, not memory.

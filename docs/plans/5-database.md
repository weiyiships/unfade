# Plan: #5 Add Postgres database with Drizzle schema and migrations

## Context

You chose #5 over #8. #8's "a `photo` row is created" criterion needs a database, and #5 is the prerequisite for #8, #9, #11, and #15–#18. This PR must show the four-phase workflow (Explore → Plan → Implement → Commit) and strict TDD (red → green → refactor) in git history, with at least 3 commits.

**#5 acceptance criteria**

1. Neon Postgres connected; `DATABASE_URL` and `DATABASE_URL_TEST` documented in `.env.example`
2. Drizzle schema for `user`, `photo`, `restoration` matches PRD §9 (`photo.user_id` nullable; `restoration.status` is `queued | processing | succeeded | failed`)
3. `user.email` unique and case-insensitive
4. `npm run db:generate` and `npm run db:migrate` work; first migration committed
5. Database access lives only in `src/lib/db`

**Explore findings**

- There's no DB code or dependencies yet. Vitest only includes `src/**/*.test.{ts,tsx}`, and coverage includes `src/lib/**` (70% lines).
- Reuse `RESTORATION_STATUSES` from `src/lib/domain/restoration-status.ts` for the status enum, and `RestorationOptions` from `src/lib/domain/restoration-options.ts` to type `options_json`. One source of truth.
- `.gitignore` has `.env*`, which would also ignore `.env.example`. It needs `!.env.example`.
- CI (`.github/workflows/ci.yml`) has no database service.
- Latest versions: drizzle-orm 0.45.4, drizzle-kit 0.31.11, @electric-sql/pglite 0.6.0, @neondatabase/serverless 1.2.1, server-only.

## Approach

**Tests run against PGlite (real Postgres compiled to WASM, in memory)**, with the committed migrations applied before each test file. Constraint tests (case-insensitive unique email, enum, FKs) then exercise real Postgres behavior. This needs no network or secrets, works in CI unchanged, and keeps tests colocated in `src/lib/db/`.

- This replaces `DATABASE_URL_TEST` from the issue. I'll update CLAUDE.md's testing strategy, `.env.example`, and the issue checklist to match, and say so in the PR.

**Production uses Neon over HTTP** (`drizzle-orm/neon-http`), with `DATABASE_URL` validated by Zod in a `server-only` module.

- Criterion 1, "Neon connected", needs you to provision Neon through the Vercel Marketplace with your account. I can't do that from here, so the PR will leave that checkbox unticked with setup steps.

**Files (all new unless noted)**

- `drizzle.config.ts`: schema `src/lib/db/schema.ts`, out `drizzle/`, dialect postgresql, `DATABASE_URL`
- `src/lib/db/schema.ts`: tables
  - `users(id uuid pk, name, email, password_hash, created_at)` with a unique index on `lower(email)`
  - `photos(id uuid pk, user_id uuid null → users.id on delete cascade, original_url, file_name, width, height, created_at)` with check constraints `width > 0`, `height > 0`
  - `restorations(id uuid pk, photo_id → photos.id on delete cascade, options_json jsonb $type<RestorationOptions>, status pgEnum from RESTORATION_STATUSES default 'queued', result_url null, error null, created_at, completed_at null)`
- `src/lib/db/client.ts`: `parseDbEnv(env)` (Zod, clear error) and `getDb()` (Neon), with `import "server-only"`
- `src/lib/db/test-db.ts`: `createTestDb()`, which starts PGlite and runs `migrate()` from `drizzle/`
- `src/lib/db/*.test.ts`: tests per table and for the client env
- `drizzle/0000_*.sql` + meta: generated migration (committed)
- Modified: `package.json` (deps, `db:generate`, `db:migrate`, `db:check` scripts), `.gitignore` (`!.env.example`), `.env.example` (new), `vitest.config.ts` (`server-only` alias stub so client tests run), CI (add a `drizzle-kit check` step so schema and migrations can't drift), CLAUDE.md testing strategy

**Commit sequence (the history shows each phase)**

1. `docs(db): add plan for database schema and migrations (#5)`: this plan as `docs/plans/5-database.md` (Explore + Plan phases)
2. `chore(db): add Drizzle, PGlite, and Neon dependencies and db scripts (#5)`: deps, config, test harness, `.env.example`, `.gitignore`
3. `test(db): add failing tests for users table and case-insensitive unique email (#5)` 🔴
4. `feat(db): add users table and first migration (#5)` 🟢
5. `test(db): add failing tests for photos table (#5)` 🔴: visitor photo with null `user_id`, FK to user, positive dimensions, cascade on user delete
6. `feat(db): add photos table and migration (#5)` 🟢
7. `test(db): add failing tests for restorations table (#5)` 🔴: default `queued`, rejects unknown status, enum matches `RESTORATION_STATUSES`, options round-trip as JSON, cascade on photo delete
8. `feat(db): add restorations table and migration (#5)` 🟢
9. `refactor(db): share timestamp and id column helpers across tables (#5)` 🔵
10. `test(db): add failing tests for database env parsing (#5)` 🔴, then `feat(db): add server-only Neon client with validated DATABASE_URL (#5)` 🟢
11. `docs: update CLAUDE.md testing strategy and .env.example for PGlite tests (#5)`, plus a CI `drizzle-kit check` step

Each red commit is verified to fail (`npm test` exit ≠ 0) before committing, and each green or refactor commit passes lint, format, typecheck, and tests. Migrations are always produced by `npm run db:generate`, never hand-edited. Each green step adds the next migration (`0000_users`, `0001_photos`, `0002_restorations`), so the history shows which test drove which table.

## Verification

- `npm run lint && npm run format:check && npm run typecheck && npm test` passes, and coverage stays at or above 70%
- `npm run db:check` (drizzle-kit check) reports no drift between the schema and `drizzle/`
- `git log --oneline main..` shows the plan → chore → red/green/refactor sequence
- Optional, once you provision Neon: `vercel env pull` then `npm run db:migrate` creates the three tables

## Then

Push the branch `feat/5-database-schema`, open a PR with `Closes #5` (Neon checkbox noted as manual), the acceptance-criteria checklist, and test evidence, and request review from jooguh-dev.

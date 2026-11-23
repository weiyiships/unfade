# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Pre-code. The repository currently contains only the product requirements document, `docs/PRD.md`. There is no application code, `package.json`, build, lint, or test setup yet, so no commands exist to run.

## What is being built

Unfade: a web app where users upload old or damaged photos, restore them with an AI restoration API (general repair, face enhancement, colorization, upscaling), compare before and after, download results, and (with an account) view past restorations. See `docs/PRD.md` for user stories (§6), acceptance criteria (§7), and non-goals (§4).

## Planned architecture (from PRD §9)

- Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- AI restoration via Replicate or Gemini, called only from server routes
- Images in private Vercel Blob storage; Postgres (Neon) via Drizzle
- Restoration jobs tracked in a `restoration` table (`queued` → `processing` → `succeeded`/`failed`) and polled by the client every 2 to 3 seconds
- JWT auth in httpOnly cookies; visitor restorations are not saved and are deleted after 24 hours
- Vitest (unit), Playwright (end-to-end); deploy on Vercel with GitHub Actions CI

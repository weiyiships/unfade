# Context management strategy

How we keep Claude Code sessions focused on this repo. `CLAUDE.md` and the imported `docs/PRD.md` load at the start of every session, so they stay short and stable. Everything else is read on demand.

## What is always in context

| Source                | Why                                                    | Budget                                                  |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `CLAUDE.md`           | Stack, architecture decisions, conventions, do's/don'ts | Keep under ~200 lines; move details into `docs/`        |
| `@docs/PRD.md`        | Acceptance criteria for every story                    | Imported once; don't import other large docs            |
| `CLAUDE.local.md`     | Personal notes (gitignored), e.g. local DB URL name    | Optional, a few lines                                   |

Other docs (`docs/claude/*`, future `docs/api/*`) are linked, not imported, so they are read only when a task needs them.

## One task, one session: `/clear`

- Start each GitHub issue with `/clear` (or a fresh `claude`) so earlier work doesn't steer the next task.
- Begin the new session by naming the issue and PRD story: "Work on #12, US-3 / FR-3."
- Also `/clear` after a dead end (for example, a failed approach to the Blob upload flow) so the bad attempt isn't repeated.

## Long tasks: `/compact`

- Use `/compact` when a single issue runs long, for example after a big test run or after reading many provider docs, and the conversation is still on track.
- Give it focus instructions so the summary keeps what matters:
  `/compact keep: issue #12 acceptance criteria, files changed, failing test names, decisions made; drop: full test logs and doc dumps`
- Prefer `/clear` over `/compact` when switching to an unrelated task.

## Resuming work: `--continue` and `--resume`

- `claude --continue` (`-c`) reopens the most recent session in this directory with its context, for example after closing the terminal mid-issue.
- `claude --resume` (`-r`) lets you pick an older session, for example to go back to a paused branch.
- After resuming, run `git status` and the test suite before continuing, since files may have changed outside the session.

## Keeping context small

- Use subagents (Explore) for broad searches so only the conclusion comes back, not file dumps.
- Run single tests (`npx vitest run <file>` or `-t "<name>"`) instead of the full suite while iterating.
- Don't paste full provider API responses or Playwright traces into the chat; summarize or point to the file.
- Record lasting decisions in `CLAUDE.md` (Architecture decisions) instead of relying on chat history.

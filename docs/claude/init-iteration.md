# From `/init` to CLAUDE.md

We ran `/init` when the repo contained only `docs/PRD.md`. Its output is saved unchanged in [`init-baseline.md`](init-baseline.md). This file records what the baseline got right, what it missed, and how `CLAUDE.md` was changed.

## What `/init` produced

`/init` reads the repo and summarizes commands and architecture. With no code, it correctly reported that no build, lint, or test commands exist and summarized PRD §9 as a planned architecture. It added nothing invented, but it gave a future session little to act on.

## Gaps found in the baseline

| Gap in `/init` output                                               | Risk if left as is                                                          | Change in `CLAUDE.md`                                                          |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PRD only mentioned by path                                          | Claude may not read the acceptance criteria before building                 | `@docs/PRD.md` import, plus a map of which PRD section answers what            |
| "No commands exist"                                                 | Each session invents its own script names                                   | Target `npm` scripts, including single-test commands, and a definition of done |
| Stack listed without versions or supporting libraries               | Mismatched choices (validation, auth, icons)                                | Full stack with versions and libraries                                         |
| "Replicate or Gemini" left open with no structure                   | Provider SDK calls spread across the codebase                               | Decision 2: `RestorationProvider` adapter plus `FakeProvider`                  |
| 10 MB uploads vs. the 4.5 MB Vercel Function body limit not noticed | Upload route fails in production for large scans                            | Decision 3: direct-to-Blob client uploads                                      |
| Temporary provider output URLs not mentioned                        | History links break after the provider deletes outputs                      | Decision 5: copy results into our private Blob                                 |
| Visitor ownership and 24-hour deletion stated but not designed      | Visitors can't see their own private images, or old files never get deleted | Decision 7: anonymous signed session plus a daily cron cleanup                 |
| No coding conventions                                               | Inconsistent structure and error shapes                                     | Coding conventions section                                                     |
| Testing named only as tools                                         | Tests call the paid AI API, which is slow, flaky, and expensive             | Testing strategy, with the rule to never call a real provider in tests         |
| No do's and don'ts                                                  | Scope creep into PRD non-goals; personal photos leaked into logs            | Do's / Don'ts tied to PRD §4 and §8                                            |
| No guidance on session hygiene                                      | Long sessions lose track of the current issue                               | Link to `context-management.md`                                                |

## Where the guidance now lives

- `CLAUDE.md`: always loaded; decisions and rules.
- `docs/PRD.md`: imported into `CLAUDE.md`; what to build.
- `.claude/settings.json`: enforced permissions. `CLAUDE.md` asks Claude not to push or deploy without asking; the settings file makes Claude Code ask (`ask`) or refuse (`deny`) regardless.
- `docs/claude/context-management.md`: read on demand.

## Next iteration

After the setup milestone, run `/init` again. It will see real `package.json` scripts and folder structure. Compare its output with the Commands and Architecture decisions sections, and fix whichever side is wrong.

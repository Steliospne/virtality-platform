## Agent skills

### Formatting

Before staging or committing code changes, run `pnpm format` from the repo root (`prettier --write .`). Include any files Prettier modifies in the same commit as the related work. Do not skip formatting because a diff looks small or formatting-only.

### Git / PRs

PRs target **`dev`** (staging). Promote to production with `dev` → **`main`** after staging verification. Never open routine work PRs into `main`. See `docs/agents/git-workflow.md`.

### Issue tracker

Issues live in GitHub Issues for this repo. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles mapped to GitHub label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo — read `CONTEXT-MAP.md` at the repo root, then the relevant per-context `CONTEXT.md`. System-wide ADRs in `docs/adr/`. See `docs/agents/domain.md`.

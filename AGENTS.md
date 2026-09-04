## Agent skills

### Formatting

Before staging or committing code changes, run `pnpm format` from the repo root (`prettier --write .`). Include any files Prettier modifies in the same commit as the related work. Do not skip formatting because a diff looks small or formatting-only.

### Package builds

Apps and services load workspace packages from `dist/`, not `src/`. After changing anything under `packages/` (or any other non-`apps/` tree that publishes into those packages), run `pnpm build:packages` from the repo root before verifying the change in an app or against a running API. Done when the command exits 0.

### Database migrations

Do not hand-write Prisma migration files. When schema changes are needed, update the Prisma schema and use `pnpm db:migrate:dev` to generate the migration, or `pnpm db:generate` when only client/codegen output is needed.

### Git / PRs

PRs target **`dev`** (staging). Promote to production with `dev` → **`main`** after staging verification. Never open routine work PRs into `main`. See `docs/agents/git-workflow.md`.

### Issue tracker

Issues live on **`Virtality-app/virtality-platform`**, not on a personal fork. Always set `GH_REPO=Virtality-app/virtality-platform` or pass `--repo Virtality-app/virtality-platform` for `gh issue` commands. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles mapped to GitHub label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo — read `CONTEXT-MAP.md` at the repo root, then the relevant per-context `CONTEXT.md`. System-wide ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Composition

Compose UI from small files: one JSX component per file. Read `docs/agents/ui-composition.md` when creating or editing React components, pages, or feature UI.

### Tailwind class names

Build `className` with the `cn` helper, not template literals or string concatenation. Read `docs/agents/tailwind-classnames.md` when writing or editing a `className`.

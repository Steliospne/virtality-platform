# Git workflow: branches and PRs

## Branches

| Branch | Role                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| `dev`  | Integration branch. Feature PRs merge here. Deploys to **staging** / preview.     |
| `main` | Production. Updated only by merging already-tested `dev` (or equivalent promote). |

There is no separate long-lived `staging` git branch: staging tracks `dev`.

## Pull requests

- **Open feature/fix/docs PRs against `dev` only.** Do not target `main`.
- After merge to `dev`, verify on staging.
- Promote to production with a simple merge (or PR) of `dev` → `main` once staging looks good.

Agents creating PRs with `gh pr create` must pass `--base dev` (or ensure the default base is `dev`). Never open a routine work PR into `main`.

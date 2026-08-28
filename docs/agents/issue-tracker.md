# Issue tracker: GitHub

Issues and PRDs for this project live as GitHub issues on the **upstream org repo**, not on a personal fork.

**Canonical issue repo:** `Virtality-app/virtality-platform`

This clone may have `origin` pointing at a fork (`Steliospne/virtality-platform` or similar). `gh` defaults to `origin`, so **always** target upstream when creating, listing, viewing, commenting on, labeling, or closing issues:

- Prefer `GH_REPO=Virtality-app/virtality-platform` in the environment (Sandcastle sets this via `.sandcastle/.env`; export it in interactive shells too).
- Or pass `--repo Virtality-app/virtality-platform` on every `gh issue` / `gh api` issues call.
- Do **not** open project tickets on the fork. If one lands there by mistake, recreate it upstream and close the fork copy as a duplicate.

Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --repo Virtality-app/virtality-platform --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo Virtality-app/virtality-platform --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo Virtality-app/virtality-platform --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo Virtality-app/virtality-platform --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo Virtality-app/virtality-platform --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo Virtality-app/virtality-platform --comment "..."`

With `GH_REPO` set, you can omit `--repo`. Never rely on the fork remote alone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `Virtality-app/virtality-platform`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo Virtality-app/virtality-platform --comments` (or rely on `GH_REPO`).

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets. All of these run against `Virtality-app/virtality-platform` (`GH_REPO` or `--repo`).

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint, or GraphQL `addSubIssue` with `GraphQL-Features: sub_issues`). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**: the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/Virtality-app/virtality-platform/issues/<child>/dependencies/blocked_by --input -` and JSON `{"issue_id": <blocker-db-id>}` (integer, not a string; `-F` stringifies and 422s). `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/Virtality-app/virtality-platform/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only: the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`: the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

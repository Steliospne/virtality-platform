# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Companion label rule

When applying `ready-for-agent`, always add `Sandcastle` in the same operation.

- Required pair: `ready-for-agent` + `Sandcastle`
- Do not leave `ready-for-agent` issues without `Sandcastle`

## Other repo-specific labels

Not part of the five canonical triage roles above, but used elsewhere in this repo's workflows:

| Label  | Meaning                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec` | A parent/PRD issue tracked via GitHub sub-issues (`subIssuesSummary`), not implemented directly. Title prefix (`Spec:`, `PRD:`, or none) varies — the label is the reliable signal. See `docs/agents/issue-tracker.md` for the parent-ticket close check that reads it. |

Apply `spec` to a parent issue when it's created (planning/triage), not after the fact — the merger step depends on it being present to know which closed-out parents to check.

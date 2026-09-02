# TASK

Merge the following branches into the current branch:

{{BRANCHES}}

For each branch:

1. Run `git merge <branch> --no-edit`
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the correct resolution
3. After resolving conflicts, run `npm run typecheck` and `npm run test` to verify everything works
4. If tests fail, fix the issues before proceeding to the next branch

After all branches are merged, make a single commit summarizing the merge.

# CLOSE ISSUES

For each branch that was merged, close its issue using the following command (`GH_REPO` already points at the upstream org repo):

`gh issue close <ID> --comment "Completed by Sandcastle"`

Here are all the issues:

{{ISSUES}}

# CHECK PARENT SPEC TICKETS

For each issue you just closed, check whether it has a parent (see `docs/agents/issue-tracker.md` § Spec / parent tickets for the full command reference):

`gh issue view <ID> --json parent --jq '.parent.number'`

If it has a parent, check whether that parent is ready to close:

`gh issue view <parent> --json state,labels,subIssuesSummary`

Close the parent — `gh issue close <parent> --comment "..."` — only if **all** of:

- `state == "OPEN"`
- `labels` includes `spec`
- `subIssuesSummary.percentCompleted == 100`

The close comment must name the sub-issues that completed it (e.g. "All sub-issues (#215, #216, #217) are closed and merged into dev."), not just assert completion. Do not close a parent missing the `spec` label, even if every sub-issue is closed — that label is the explicit signal this is safe to automate for.

Once you've merged everything you can and checked parent tickets, output <promise>COMPLETE</promise>.

// Parallel Planner with Review — four-phase orchestration loop
//
// This template drives a multi-phase workflow:
//   Phase 1 (Plan):             An opus agent analyzes open issues, builds a
//                               dependency graph, and outputs a <plan> JSON
//                               listing unblocked issues with branch names.
//   Phase 2 (Execute + Review): For each issue, a sandbox is created via
//                               createSandbox(). The implementer runs first
//                               (100 iterations). If it produces commits, a
//                               reviewer runs in the same sandbox on the same
//                               branch (1 iteration). All issue pipelines run
//                               concurrently via Promise.allSettled().
//   Phase 3 (Merge):            A single agent merges all completed branches
//                               into the current branch.
//
// The outer loop repeats up to MAX_ITERATIONS times so that newly unblocked
// issues are picked up after each round of merges.
//
// Usage:
//   pnpm sandcastle
// Or:
//   npx tsx --env-file=.sandcastle/.env .sandcastle/main.mts
// Or add to package.json:
//   "scripts": { "sandcastle": "npx tsx --env-file=.sandcastle/.env .sandcastle/main.mts" }

import { execSync } from 'node:child_process'
import * as sandcastle from '@ai-hero/sandcastle'
import { docker } from '@ai-hero/sandcastle/sandboxes/docker'
import { z } from 'zod'

// const AGENT_MODEL = 'cursor-grok-4.5-medium'
// const AGENT_MODEL = 'composer-2.5'

// Sandcastle also injects `.sandcastle/.env` into sandboxes. Prefer running via
// `pnpm sandcastle` so `--env-file` populates process.env for this check.
for (const key of [
  'GH_REPO',
  'GH_TOKEN',
  'CURSOR_API_KEY',
  'AGENT_MODEL',
] as const) {
  if (!process.env[key]) {
    throw new Error(
      `${key} is undefined. Set it in .sandcastle/.env (see .env.example) or export it in your shell.`,
    )
  }
}

const AGENT_MODEL = process.env.AGENT_MODEL!

// The planner emits its plan as JSON inside <plan> tags; Output.object extracts
// and validates it against this schema. We use Zod here, but any Standard
// Schema validator works just as well — Valibot, ArkType, etc. See
// https://standardschema.dev.
const planSchema = z.object({
  issues: z.array(
    z.object({ id: z.string(), title: z.string(), branch: z.string() }),
  ),
})

type PlanIssue = z.infer<typeof planSchema>['issues'][number]

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Maximum number of plan→execute→merge cycles before stopping.
// Raise this if your backlog is large; lower it for a quick smoke-test run.
const MAX_ITERATIONS = 10

// Hooks run inside the sandbox before the agent starts each iteration.
// npm install ensures the sandbox always has fresh dependencies.
const hooks = {
  sandbox: { onSandboxReady: [{ command: 'pnpm install' }] },
}

// Copy node_modules from the host into the worktree before each sandbox
// starts. Avoids a full npm install from scratch; the hook above handles
// platform-specific binaries and any packages added since the last copy.
const copyToWorktree = ['node_modules']

// The branch sandcastle is running from, i.e. the merge target. Issue
// branches (sandcastle/issue-<n>) are forked from this branch's HEAD, and it
// only moves forward via the merge phase below — so `<hostBranch>..HEAD`
// inside an issue's worktree always lists exactly that issue's own commits,
// however many separate runs (across restarts) produced them.
const hostBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`)

  // -------------------------------------------------------------------------
  // Phase 1: Plan
  //
  // The planning agent (opus, for deeper reasoning) reads the open issue list,
  // builds a dependency graph, and selects the issues that can be worked in
  // parallel right now (i.e., no blocking dependencies on other open issues).
  //
  // It outputs a <plan> JSON block — Output.object parses and validates it.
  // -------------------------------------------------------------------------
  const plan = await sandcastle.run({
    hooks,
    sandbox: docker(),
    branchStrategy: { type: 'merge-to-head' },
    copyToWorktree,
    name: 'planner',
    // One iteration is enough: the planner just needs to read and reason,
    // not write code. (Structured output requires maxIterations: 1.)
    maxIterations: 1,
    // Opus for planning: dependency analysis benefits from deeper reasoning.
    agent: sandcastle.cursor(AGENT_MODEL),
    promptFile: './.sandcastle/plan-prompt.md',
    // Extract and validate the <plan> JSON into a typed object. Throws
    // StructuredOutputError if the tag is missing, the JSON is malformed, or
    // validation fails — which aborts the loop.
    output: sandcastle.Output.object({ tag: 'plan', schema: planSchema }),
  })

  const issues: PlanIssue[] = plan.output.issues

  if (issues.length === 0) {
    // No unblocked work — either everything is done or everything is blocked.
    console.log('No unblocked issues to work on. Exiting.')
    break
  }

  console.log(
    `Planning complete. ${issues.length} issue(s) to work in parallel:`,
  )
  for (const issue of issues) {
    console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`)
  }

  // -------------------------------------------------------------------------
  // Phase 2: Execute + Review
  //
  // For each issue, create a sandbox via createSandbox() so the implementer
  // and reviewer share the same sandbox instance per branch. The implementer
  // runs first; if it produces commits, the reviewer runs in the same sandbox.
  //
  // Promise.allSettled means one failing pipeline doesn't cancel the others.
  // -------------------------------------------------------------------------

  const settled = await Promise.allSettled(
    issues.map(async (issue) => {
      const sandbox = await sandcastle.createSandbox({
        branch: issue.branch,
        sandbox: docker(),
        hooks,
        copyToWorktree,
      })

      try {
        // Run the implementer
        const implement = await sandbox.run({
          name: 'implementer',
          maxIterations: 100,
          agent: sandcastle.cursor(AGENT_MODEL),
          promptFile: './.sandcastle/implement-prompt.md',
          promptArgs: {
            TASK_ID: issue.id,
            ISSUE_TITLE: issue.title,
            BRANCH: issue.branch,
          },
        })

        // Decide whether there's anything to review/merge from the branch's
        // actual git state, not from `implement.commits` (commits made only
        // during *this* run). `createSandbox` reuses an existing branch
        // as-is, so a prior run's commits — e.g. left behind by a reviewer
        // that failed before this run's retry/fallback logic existed, or
        // just by a killed/restarted sandcastle process — are already on
        // disk even when this run's implementer makes zero new commits. Only
        // trusting `implement.commits` there would keep reporting "no
        // commits produced" for a branch that has real, unmerged work,
        // reproducing the infinite loop this whole check exists to avoid.
        const branchLog = await sandbox.exec(`git rev-list ${hostBranch}..HEAD`)
        const branchCommits = branchLog.stdout
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((sha) => ({ sha }))

        if (branchCommits.length === 0) {
          return { ...implement, commits: branchCommits }
        }

        // One retry absorbs transient reviewer failures (network blip,
        // sandbox flake). If it fails twice, fall back to the branch's
        // commits rather than discarding them — otherwise the branch's work
        // is dropped from this iteration's merge, the next planning pass
        // re-queues the same issue, the implementer sees nothing left to
        // do, and the loop spins with "No commits produced" forever even
        // though the work exists on the branch. This also terminates
        // deterministic reviewer failures (e.g. a provider-side prompt-size
        // limit) that would otherwise fail identically on every retry.
        const REVIEW_ATTEMPTS = 2
        let lastReviewError: unknown
        for (let attempt = 1; attempt <= REVIEW_ATTEMPTS; attempt++) {
          try {
            const review = await sandbox.run({
              name: 'reviewer',
              maxIterations: 1,
              agent: sandcastle.cursor(AGENT_MODEL),
              promptFile: './.sandcastle/review-prompt.md',
              promptArgs: {
                BRANCH: issue.branch,
              },
            })

            // Recompute from git rather than concatenating arrays: the
            // reviewer may itself have committed fixes, and branchCommits
            // already captures everything implement.commits would have.
            const postReviewLog = await sandbox.exec(
              `git rev-list ${hostBranch}..HEAD`,
            )
            const finalCommits = postReviewLog.stdout
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((sha) => ({ sha }))

            return { ...review, commits: finalCommits }
          } catch (reviewError) {
            lastReviewError = reviewError
            console.error(
              `  ⚠ ${issue.id} (${issue.branch}) reviewer attempt ${attempt}/${REVIEW_ATTEMPTS} failed: ${reviewError}`,
            )
          }
        }

        console.error(
          `  ⚠ ${issue.id} (${issue.branch}) reviewer exhausted ${REVIEW_ATTEMPTS} attempts, proceeding with branch commits: ${lastReviewError}`,
        )
        return { ...implement, commits: branchCommits }
      } finally {
        await sandbox.close()
      }
    }),
  )

  // Log any agents that threw (network error, sandbox crash, etc.).
  for (const [i, outcome] of settled.entries()) {
    if (outcome.status === 'rejected') {
      console.error(
        `  ✗ ${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`,
      )
    }
  }

  // Only pass branches that actually produced commits to the merge phase.
  // An agent that ran successfully but made no commits has nothing to merge.
  const completedIssues = settled
    .map((outcome, i) => ({ outcome, issue: issues[i]! }))
    .filter(
      (entry) =>
        entry.outcome.status === 'fulfilled' &&
        entry.outcome.value.commits.length > 0,
    )
    .map((entry) => entry.issue)

  const completedBranches = completedIssues.map((i) => i.branch)

  console.log(
    `\nExecution complete. ${completedBranches.length} branch(es) with commits:`,
  )
  for (const branch of completedBranches) {
    console.log(`  ${branch}`)
  }

  if (completedBranches.length === 0) {
    // All agents ran but none made commits — nothing to merge this cycle.
    console.log('No commits produced. Nothing to merge.')
    continue
  }

  // -------------------------------------------------------------------------
  // Phase 3: Merge
  //
  // One agent merges all completed branches into the current branch,
  // resolving any conflicts and running tests to confirm everything works.
  //
  // The {{BRANCHES}} and {{ISSUES}} prompt arguments are lists that the agent
  // uses to know which branches to merge and which issues to close.
  // -------------------------------------------------------------------------
  await sandcastle.run({
    hooks,
    sandbox: docker(),
    branchStrategy: { type: 'merge-to-head' },
    copyToWorktree,
    name: 'merger',
    maxIterations: 1,
    agent: sandcastle.cursor(AGENT_MODEL),
    promptFile: './.sandcastle/merge-prompt.md',
    promptArgs: {
      // A markdown list of branch names, one per line.
      BRANCHES: completedBranches.map((b) => `- ${b}`).join('\n'),
      // A markdown list of issue IDs and titles, one per line.
      ISSUES: completedIssues.map((i) => `- ${i.id}: ${i.title}`).join('\n'),
    },
  })

  console.log('\nBranches merged.')
}

console.log('\nAll done.')

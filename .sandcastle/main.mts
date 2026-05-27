// Sequential Reviewer — implement-then-review loop
//
// This template drives a two-phase workflow per issue:
//   Phase 1 (Implement): A sonnet agent picks an open issue, works on it
//                        on a dedicated branch, commits the changes, and signals
//                        completion.
//   Phase 2 (Review):    A second sonnet agent reviews the branch diff and either
//                        approves it or makes corrections directly on the branch.
//
// Both phases share a single sandbox created via createSandbox(), so the
// implementer and reviewer work on the same explicit branch.
//
// The outer loop repeats up to MAX_ITERATIONS times, processing one issue per
// iteration. This is a middle-complexity option between the simple-loop (no review
// gate) and the parallel-planner (concurrent execution with a planning phase).
//
// Usage:
//   npx tsx .sandcastle/main.mts
// Or add to package.json:
//   "scripts": { "sandcastle": "npx tsx .sandcastle/main.mts" }

import * as sandcastle from '@ai-hero/sandcastle'
import { docker } from '@ai-hero/sandcastle/sandboxes/docker'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Anchor to the git repo root (parent of .sandcastle/), not process.cwd().
// pnpm runs this file with cwd=.sandcastle; sandcastle's default Docker image
// tag is derived from cwd and would become the invalid tag "sandcastle:.sandcastle".
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DOCKER_IMAGE = `sandcastle:${basename(REPO_ROOT)
  .toLowerCase()
  .replace(/[^a-z0-9_.-]/g, '-')}`

// Cursor model for agent CLI. Override when composer-2 hits resource_exhausted (capacity).
// Examples: auto, composer-1, claude-sonnet-4-6, gpt-5.3-codex
const CURSOR_MODEL = process.env.SANDCASTLE_CURSOR_MODEL ?? 'composer-2'
const cursorAgent = () => sandcastle.cursor(CURSOR_MODEL)

const isResourceExhausted = (error: unknown) =>
  String(error).includes('resource_exhausted')

/** Retry Cursor agent calls when the API returns transient capacity errors. */
async function runWithCursorRetries<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await run()
    } catch (error) {
      if (!isResourceExhausted(error) || attempt === maxAttempts) {
        console.error(`[${label}] failed:`, error)
        return null
      }
      const waitSec = 30 * attempt
      console.warn(
        `[${label}] Cursor resource_exhausted — retry ${attempt}/${maxAttempts - 1} in ${waitSec}s (model: ${CURSOR_MODEL})`,
      )
      await new Promise((resolve) => setTimeout(resolve, waitSec * 1000))
    }
  }
  return null
}

// Maximum number of implement→review cycles to run before stopping.
// Each cycle works on one issue. Raise this to process more issues per run.
const MAX_ITERATIONS = 10

// Hooks run inside the sandbox before the agent starts each iteration.
// npm install ensures the sandbox always has fresh dependencies.
const hooks = {
  sandbox: { onSandboxReady: [{ command: 'npm install' }] },
}

// Copy node_modules from the host into the worktree before each sandbox
// starts. Avoids a full npm install from scratch; the hook above handles
// platform-specific binaries and any packages added since the last copy.
const copyToWorktree = ['node_modules']

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

// Generate a unique branch name for this loop.
const branch = `sandcastle/sequential-reviewer/${Date.now()}`

// Create a single sandbox that both the implementer and reviewer share.
// This gives both agents a real, named branch that persists across phases.
const sandbox = await sandcastle.createSandbox({
  branch,
  cwd: REPO_ROOT,
  sandbox: docker({ imageName: DOCKER_IMAGE }),
  hooks,
  copyToWorktree,
})

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`)

  // -----------------------------------------------------------------------
  // Phase 1: Implement
  //
  // A sonnet agent picks the next open issue, writes the
  // implementation (using RGR: Red → Green → Repeat → Refactor), and
  // commits the result.
  //
  // The agent signals completion via <promise>COMPLETE</promise> when done.
  // -----------------------------------------------------------------------
  const implement = await runWithCursorRetries('implementer', () =>
    sandbox.run({
      name: 'implementer',
      maxIterations: 100,
      agent: cursorAgent(),
      promptFile: './implement-prompt.md',
      completionSignal: '<promise>COMPLETE</promise>',
      logging: {
        type: 'file',
        path: `./logs/${branch.replace('/', '-')}-implementer.log`,
        onAgentStreamEvent: (event) => {
          if (event.type === 'text') {
            console.log(event.message)
          }
        },
      },
    }),
  )

  if (!implement?.commits.length) {
    console.log('Implementation agent made no commits. Skipping review.')
    continue
  }

  console.log(`\nImplementation complete on branch: ${branch}`)
  console.log(`Commits: ${implement.commits.length}`)

  // -----------------------------------------------------------------------
  // Phase 2: Review
  //
  // A second sonnet agent reviews the diff of the branch produced by
  // Phase 1. It uses the {{BRANCH}} prompt argument to inspect the right
  // branch, and either approves or makes corrections directly on the branch.
  // -----------------------------------------------------------------------
  const review = await runWithCursorRetries('reviewer', () =>
    sandbox.run({
      name: 'reviewer',
      maxIterations: 1,
      agent: cursorAgent(),
      promptFile: './review-prompt.md',
      promptArgs: {
        BRANCH: branch,
      },
      logging: {
        type: 'file',
        path: `./logs/${branch.replace('/', '-')}-reviewer.log`,
        onAgentStreamEvent: (event) => {
          if (event.type === 'text') {
            console.log(event.message)
          }
        },
      },
    }),
  )

  if (review) {
    console.log('\nReview complete.')
  }
}

await sandbox.close()

console.log('\nAll done.')

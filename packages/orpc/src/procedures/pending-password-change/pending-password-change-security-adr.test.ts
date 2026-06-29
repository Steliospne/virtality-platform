import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../../', import.meta.url))

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

const ADR_PATH = 'docs/adr/0002-pending-password-change-security.md'

const REQUIRED_TOPICS: Array<{ topic: string; pattern: RegExp }> = [
  {
    topic: 'distinction from password reset and account recovery',
    pattern: /account recovery|password reset/i,
  },
  {
    topic: 'confirmation page with explicit approve action',
    pattern: /confirmation page|explicit.*approve/i,
  },
  {
    topic: 'server-side hashed pending material',
    pattern: /hashed|plaintext.*not|server-side/i,
  },
  {
    topic: 'first-class persistence instead of Verification rows',
    pattern: /Verification|explicit persistence|first-class/i,
  },
  {
    topic: 'latest-request-wins and supersede semantics',
    pattern: /latest-request-wins|supersede/i,
  },
  {
    topic: '30-minute expiry',
    pattern: /30.minute|30-minute/i,
  },
  {
    topic: 'token-only approval without an active session',
    pattern: /token-only|active browser session is not required/i,
  },
  {
    topic: 'resend behavior',
    pattern: /resend/i,
  },
  {
    topic: 'cancel behavior',
    pattern: /cancel/i,
  },
  {
    topic: 'rejected alternatives',
    pattern: /rejected alternatives/i,
  },
]

describe('ADR 0002 pending password change security', () => {
  const adr = readRepoFile(ADR_PATH)

  it.each(REQUIRED_TOPICS)('documents $topic', ({ pattern }) => {
    expect(adr).toMatch(pattern)
  })
})

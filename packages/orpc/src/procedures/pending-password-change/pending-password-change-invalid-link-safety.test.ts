import { ORPCError } from '@orpc/server'
import { describe, expect, it, vi } from 'vitest'
import { INVALID_APPROVAL_LINK_MESSAGE } from '@virtality/shared/utils'
import {
  approvePendingPasswordChange,
  approvePendingPasswordSetup,
  hashApprovalToken,
  inspectPendingPasswordChange,
  type PendingPasswordChangeDeps,
} from './pending-password-change.ts'

const now = new Date('2026-06-29T12:00:00.000Z')

const SENSITIVE_REASON_PATTERNS = [
  /cancelled/i,
  /canceled/i,
  /consumed/i,
  /already used/i,
  /superseded/i,
  /replaced/i,
  /unknown token/i,
  /malformed/i,
  /not found/i,
]

function createDeps(
  pendingRecords: Array<Record<string, unknown>>,
  account: {
    id: string
    providerId: string
    password: string | null
  } | null = null,
) {
  const accounts = account ? [{ userId: 'user-1', ...account }] : []

  const pendingPasswordChange = {
    findFirst: vi.fn(
      async (args?: {
        where?: Record<string, unknown>
        orderBy?: { createdAt?: 'desc' }
      }) => {
        const where = args?.where ?? {}
        const matches = pendingRecords.filter((record) =>
          Object.entries(where).every(([key, value]) => record[key] === value),
        )

        if (args?.orderBy?.createdAt === 'desc') {
          return (
            matches.sort(
              (a, b) =>
                new Date(String(b.createdAt)).getTime() -
                new Date(String(a.createdAt)).getTime(),
            )[0] ?? null
          )
        }

        return matches[0] ?? null
      },
    ),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  }

  const accountClient = {
    findFirst: vi.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        accounts.find((item) =>
          Object.entries(where).every(
            ([key, value]) => item[key as keyof typeof item] === value,
          ),
        ) ?? null,
    ),
    create: vi.fn(),
    update: vi.fn(),
  }

  return {
    deps: {
      pendingPasswordChange,
      account: accountClient,
      session: { deleteMany: vi.fn() },
      now: () => now,
    } as unknown as PendingPasswordChangeDeps,
    pendingRecords,
    accounts,
  }
}

function pendingRecord(
  overrides: Partial<Record<string, unknown>> & {
    token: string
    status: string
  },
) {
  const { token, ...rest } = overrides
  return {
    id: 'pending-1',
    userId: 'user-1',
    kind: 'SETUP',
    pendingPasswordHash: 'hashed:ValidPass1',
    approvalTokenHash: hashApprovalToken(token),
    initiatingSessionId: 'session-1',
    destinationEmail: 'user@example.com',
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    createdAt: now,
    ...rest,
  }
}

async function expectGenericApprovalFailure(
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action()
    throw new Error('expected approval to fail')
  } catch (error) {
    expect(error).toBeInstanceOf(ORPCError)
    const message = (error as ORPCError<string, unknown>).message
    expect(message).toBe(INVALID_APPROVAL_LINK_MESSAGE)
    for (const pattern of SENSITIVE_REASON_PATTERNS) {
      expect(message).not.toMatch(pattern)
    }
  }
}

describe('pending password change invalid approval link safety', () => {
  it.each([
    {
      label: 'expired',
      record: pendingRecord({
        token: 'expired-token',
        status: 'PENDING',
        expiresAt: new Date(now.getTime() - 1_000),
      }),
      token: 'expired-token',
    },
    {
      label: 'already consumed',
      record: pendingRecord({
        token: 'consumed-token',
        status: 'APPROVED',
        approvedAt: now,
      }),
      token: 'consumed-token',
    },
    {
      label: 'cancelled',
      record: pendingRecord({
        token: 'cancelled-token',
        status: 'CANCELLED',
        cancelledAt: now,
      }),
      token: 'cancelled-token',
    },
    {
      label: 'superseded',
      record: pendingRecord({
        token: 'superseded-token',
        status: 'SUPERSEDED',
        supersededAt: now,
      }),
      token: 'superseded-token',
    },
    {
      label: 'replaced by resend',
      record: pendingRecord({
        token: 'old-resend-token',
        status: 'PENDING',
        approvalTokenHash: hashApprovalToken('new-resend-token'),
      }),
      token: 'old-resend-token',
    },
  ])(
    'does not approve $label links and inspect returns a generic invalid state',
    async ({ record, token }) => {
      const { deps } = createDeps([record])

      await expectGenericApprovalFailure(() =>
        approvePendingPasswordSetup(deps, token),
      )
      await expectGenericApprovalFailure(() =>
        approvePendingPasswordChange(deps, token),
      )

      const inspectResult = await inspectPendingPasswordChange(deps, token)
      expect(inspectResult).toEqual({ valid: false, canReturnToProfile: false })
      expect(JSON.stringify(inspectResult)).not.toMatch(
        /cancelled|canceled|consumed|superseded|replaced|unknown token|malformed/i,
      )
    },
  )

  it('treats unknown tokens as invalid without revealing account state', async () => {
    const { deps } = createDeps([])

    await expectGenericApprovalFailure(() =>
      approvePendingPasswordChange(deps, 'unknown-token'),
    )

    const inspectResult = await inspectPendingPasswordChange(
      deps,
      'unknown-token',
    )
    expect(inspectResult).toEqual({ valid: false, canReturnToProfile: false })
    expect(JSON.stringify(inspectResult)).not.toMatch(
      /cancelled|canceled|consumed|superseded|replaced|unknown token|malformed/i,
    )
  })

  it('offers profile navigation only to the matching signed-in user on invalid links', async () => {
    const { deps } = createDeps([
      pendingRecord({
        token: 'cancelled-token',
        status: 'CANCELLED',
        cancelledAt: now,
      }),
    ])

    expect(
      await inspectPendingPasswordChange(deps, 'cancelled-token', 'user-1'),
    ).toEqual({ valid: false, canReturnToProfile: true })
    expect(
      await inspectPendingPasswordChange(deps, 'cancelled-token', 'user-2'),
    ).toEqual({ valid: false, canReturnToProfile: false })
    expect(await inspectPendingPasswordChange(deps, 'cancelled-token')).toEqual(
      { valid: false, canReturnToProfile: false },
    )
  })

  it('does not offer profile navigation for unknown tokens even when a viewer is signed in', async () => {
    const { deps } = createDeps([])

    expect(
      await inspectPendingPasswordChange(deps, 'unknown-token', 'user-1'),
    ).toEqual({ valid: false, canReturnToProfile: false })
  })
})

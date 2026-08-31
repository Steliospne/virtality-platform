import { describe, expect, it, vi } from 'vitest'
import {
  approvePendingAccountDeletion,
  buildDeletedAccountEmail,
  cancelPendingAccountDeletion,
  createPendingAccountDeletion,
  getActivePendingAccountDeletion,
  hashApprovalToken,
  inspectPendingAccountDeletion,
  PENDING_ACCOUNT_DELETION_EXPIRY_MS,
  resendPendingAccountDeletion,
  type PendingAccountDeletionDeps,
} from './pending-account-deletion.ts'

const now = new Date('2026-06-29T12:00:00.000Z')

const buildTestApprovalUrl = (token: string) =>
  `https://console.test/delete-account/confirm?token=${token}`

const baseInput = {
  userId: 'user-1',
  email: 'user@example.com',
  initiatingSessionId: 'session-1',
}

function createDeps(overrides: {
  pendingRecords?: Array<Record<string, unknown>>
  users?: Array<Record<string, unknown>>
  sessions?: Array<{ id: string; userId: string }>
}) {
  const pendingRecords = [...(overrides.pendingRecords ?? [])]
  const users = [...(overrides.users ?? [{ id: 'user-1', deletedAt: null }])]
  const sessions = [
    ...(overrides.sessions ?? [{ id: 'session-1', userId: 'user-1' }]),
  ]

  const pendingAccountDeletion = {
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
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const record = {
        approvedAt: null,
        cancelledAt: null,
        supersededAt: null,
        createdAt: now,
        ...data,
      }
      pendingRecords.push(record)
      return record
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Record<string, unknown>
      }) => {
        const record = pendingRecords.find((item) => item.id === where.id)
        if (!record) throw new Error('not found')
        Object.assign(record, data)
        return record
      },
    ),
    updateMany: vi.fn(
      async ({
        where,
        data,
      }: {
        where: Record<string, unknown>
        data: Record<string, unknown>
      }) => {
        let count = 0
        for (const record of pendingRecords) {
          const matches = Object.entries(where).every(
            ([key, value]) => record[key] === value,
          )
          if (matches) {
            Object.assign(record, data)
            count += 1
          }
        }
        return { count }
      },
    ),
  }

  const user = {
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Record<string, unknown>
      }) => {
        const record = users.find((item) => item.id === where.id)
        if (!record) throw new Error('not found')
        Object.assign(record, data)
        return record
      },
    ),
  }

  const session = {
    deleteMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
      const before = sessions.length
      for (let i = sessions.length - 1; i >= 0; i -= 1) {
        if (sessions[i]?.userId === where.userId) sessions.splice(i, 1)
      }
      return { count: before - sessions.length }
    }),
  }

  return {
    deps: {
      pendingAccountDeletion,
      user,
      session,
      now: () => now,
      generateToken: () => 'raw-token-123',
      generateId: () => 'pending-1',
    } as unknown as PendingAccountDeletionDeps,
    pendingRecords,
    users,
    sessions,
  }
}

describe('pending account deletion lifecycle regression', () => {
  it('hashes approval tokens deterministically without storing raw tokens', () => {
    const token = 'approval-token-abc'
    const firstHash = hashApprovalToken(token)
    const secondHash = hashApprovalToken(token)

    expect(firstHash).toBe(secondHash)
    expect(firstHash).not.toBe(token)
    expect(hashApprovalToken('other-token')).not.toBe(firstHash)
  })

  it('creates a pending deletion request without deleting the user', async () => {
    const { deps, pendingRecords, users } = createDeps({})
    const sendApprovalEmail = vi.fn()

    const result = await createPendingAccountDeletion(
      deps,
      baseInput,
      sendApprovalEmail,
      buildTestApprovalUrl,
    )

    expect(result).toEqual({
      destinationEmail: 'user@example.com',
      expiresAt: new Date(now.getTime() + PENDING_ACCOUNT_DELETION_EXPIRY_MS),
    })
    expect(sendApprovalEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'user@example.com',
      approvalUrl:
        'https://console.test/delete-account/confirm?token=raw-token-123',
    })
    expect(pendingRecords[0]).toMatchObject({
      approvalTokenHash: hashApprovalToken('raw-token-123'),
      destinationEmail: 'user@example.com',
      status: 'PENDING',
    })
    expect(users).toHaveLength(1)
  })

  it('supersedes an existing pending request when a new one is created', async () => {
    const { deps, pendingRecords } = createDeps({
      pendingRecords: [
        {
          id: 'pending-old',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('old-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: new Date(now.getTime() - 60_000),
        },
      ],
    })

    await createPendingAccountDeletion(
      deps,
      baseInput,
      vi.fn(),
      buildTestApprovalUrl,
    )

    expect(pendingRecords[0]).toMatchObject({
      status: 'SUPERSEDED',
      supersededAt: now,
    })
    expect(await inspectPendingAccountDeletion(deps, 'old-token')).toEqual({
      valid: false,
      canReturnToProfile: false,
    })
  })

  it('resend rotates the approval token and expiry', async () => {
    const originalTokenHash = hashApprovalToken('original-token')
    const { deps, pendingRecords } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: originalTokenHash,
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })
    deps.generateToken = () => 'resend-token-456'

    const result = await resendPendingAccountDeletion(
      deps,
      'user-1',
      vi.fn(),
      buildTestApprovalUrl,
    )

    expect(result).toEqual({
      destinationEmail: 'user@example.com',
      expiresAt: new Date(now.getTime() + PENDING_ACCOUNT_DELETION_EXPIRY_MS),
    })
    expect(pendingRecords[0]).toMatchObject({
      approvalTokenHash: hashApprovalToken('resend-token-456'),
      status: 'PENDING',
    })
    expect(await inspectPendingAccountDeletion(deps, 'original-token')).toEqual(
      { valid: false, canReturnToProfile: false },
    )
  })

  it('cancels an active pending request', async () => {
    const { deps, pendingRecords } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('cancel-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    const result = await cancelPendingAccountDeletion(deps, 'user-1')

    expect(result).toEqual({ cancelled: true })
    expect(pendingRecords[0]).toMatchObject({
      status: 'CANCELLED',
      cancelledAt: now,
    })
    await expect(
      approvePendingAccountDeletion(deps, 'cancel-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('returns a generic invalid state for expired tokens', async () => {
    const { deps } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('expired-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() - 1_000),
          createdAt: now,
        },
      ],
    })

    await expect(
      approvePendingAccountDeletion(deps, 'expired-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('uses latest-request-wins semantics when an older token is presented', async () => {
    const { deps } = createDeps({
      pendingRecords: [
        {
          id: 'pending-old',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('old-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: new Date(now.getTime() - 60_000),
        },
        {
          id: 'pending-new',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('new-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    await expect(
      approvePendingAccountDeletion(deps, 'old-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('soft-deletes the user, frees their email, and revokes sessions on approval', async () => {
    const { deps, pendingRecords, users, sessions } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('approve-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    const result = await approvePendingAccountDeletion(deps, 'approve-token')

    expect(result).toEqual({ approved: true, userId: 'user-1' })
    expect(pendingRecords[0]).toMatchObject({
      status: 'APPROVED',
      approvedAt: now,
    })
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({
      deletedAt: now,
      banned: true,
      email: buildDeletedAccountEmail('user-1'),
      image: null,
    })
    expect(sessions).toHaveLength(0)
    await expect(
      approvePendingAccountDeletion(deps, 'approve-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('returns the active pending request for read operations', async () => {
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    const { deps } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('active-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt,
          createdAt: now,
        },
      ],
    })

    expect(await getActivePendingAccountDeletion(deps, 'user-1')).toEqual({
      id: 'pending-1',
      destinationEmail: 'user@example.com',
      expiresAt,
    })
  })

  it('inspects valid tokens without mutating lifecycle state', async () => {
    const { deps, pendingRecords } = createDeps({
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          status: 'PENDING',
          approvalTokenHash: hashApprovalToken('inspect-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    expect(await inspectPendingAccountDeletion(deps, 'inspect-token')).toEqual({
      valid: true,
    })
    expect(pendingRecords[0]).toMatchObject({ status: 'PENDING' })
  })
})

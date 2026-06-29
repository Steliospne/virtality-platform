import { describe, expect, it, vi } from 'vitest'
import {
  approvePendingPasswordChange,
  approvePendingPasswordSetup,
  cancelPendingPasswordChange,
  createPendingPasswordChange,
  createPendingPasswordSetup,
  hashApprovalToken,
  inspectPendingPasswordChange,
  pendingPasswordChangePersistencePayload,
  PENDING_PASSWORD_CHANGE_EXPIRY_MS,
  resendPendingPasswordChange,
  userHasPassword,
  type PendingPasswordChangeDeps,
} from './pending-password-change.ts'

const now = new Date('2026-06-29T12:00:00.000Z')

const baseInput = {
  userId: 'user-1',
  email: 'user@example.com',
  emailVerified: true,
  newPassword: 'ValidPass1',
  initiatingSessionId: 'session-1',
}

function createDeps(overrides: {
  pendingRecords?: Array<Record<string, unknown>>
  account?: {
    id: string
    providerId: string
    password: string | null
  } | null
  socialAccounts?: Array<{
    id: string
    providerId: string
    password: string | null
  }>
}) {
  const pendingRecords = [...(overrides.pendingRecords ?? [])]
  const accounts = [
    ...(overrides.socialAccounts ?? [
      {
        id: 'google-1',
        userId: 'user-1',
        providerId: 'google',
        password: null,
      },
    ]),
    ...(overrides.account ? [{ userId: 'user-1', ...overrides.account }] : []),
  ]

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

  const account = {
    findFirst: vi.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        accounts.find((item) =>
          Object.entries(where).every(
            ([key, value]) => item[key as keyof typeof item] === value,
          ),
        ) ?? null,
    ),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const created = { id: 'credential-1', ...data }
      accounts.push(created as (typeof accounts)[number])
      return created
    }),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Record<string, unknown>
      }) => {
        const existing = accounts.find((item) => item.id === where.id)
        if (!existing) throw new Error('not found')
        Object.assign(existing, data)
        return existing
      },
    ),
  }

  const session = {
    deleteMany: vi.fn(async () => ({ count: 0 })),
  }

  return {
    deps: {
      pendingPasswordChange,
      account,
      session,
      now: () => now,
      hashPasswordFn: vi.fn(async () => 'opaque-password-hash'),
      verifyPasswordFn: vi.fn(
        async ({ password }: { password: string }) =>
          password === 'CurrentPass1',
      ),
      generateToken: () => 'raw-token-123',
      generateId: () => 'pending-1',
    } as unknown as PendingPasswordChangeDeps,
    pendingRecords,
    accounts,
    session,
  }
}

describe('pending password setup lifecycle', () => {
  it('creates a pending setup request with hashed material and no plaintext password persistence', async () => {
    const { deps, pendingRecords } = createDeps({ account: null })
    const sendApprovalEmail = vi.fn()

    const result = await createPendingPasswordSetup(
      deps,
      baseInput,
      sendApprovalEmail,
      (token) => `https://console.test/password-setup/confirm?token=${token}`,
    )

    expect(result).toEqual({
      destinationEmail: 'user@example.com',
      expiresAt: new Date(now.getTime() + PENDING_PASSWORD_CHANGE_EXPIRY_MS),
    })
    expect(sendApprovalEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'user@example.com',
      approvalUrl:
        'https://console.test/password-setup/confirm?token=raw-token-123',
    })
    expect(pendingRecords[0]).toMatchObject(
      pendingPasswordChangePersistencePayload({
        pendingPasswordHash: 'opaque-password-hash',
        approvalTokenHash: hashApprovalToken('raw-token-123'),
        destinationEmail: 'user@example.com',
      }),
    )
    expect(JSON.stringify(pendingRecords)).not.toContain('ValidPass1')
  })

  it('rejects first-time setup when the shared password policy fails', async () => {
    const { deps } = createDeps({ account: null })
    const sendApprovalEmail = vi.fn()

    await expect(
      createPendingPasswordSetup(
        deps,
        { ...baseInput, newPassword: 'weak' },
        sendApprovalEmail,
        (token) => `https://console.test/password-setup/confirm?token=${token}`,
      ),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(sendApprovalEmail).not.toHaveBeenCalled()
  })

  it('approves a valid setup token without revoking existing sessions', async () => {
    const approvalTokenHash = hashApprovalToken('approve-token')
    const { deps, session, accounts } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash,
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    const result = await approvePendingPasswordSetup(deps, 'approve-token')

    expect(result).toEqual({ approved: true })
    expect(session.deleteMany).not.toHaveBeenCalled()
    expect(accounts.some((item) => item.providerId === 'google')).toBe(true)
    expect(accounts.some((item) => item.providerId === 'credential')).toBe(true)
  })

  it('returns a generic invalid state for expired tokens', async () => {
    const { deps } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: hashApprovalToken('expired-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() - 1_000),
          createdAt: now,
        },
      ],
    })

    await expect(
      approvePendingPasswordSetup(deps, 'expired-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(await inspectPendingPasswordChange(deps, 'expired-token')).toEqual({
      valid: false,
      canReturnToProfile: false,
    })
  })

  it('uses latest-request-wins semantics when an older token is presented', async () => {
    const { deps } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-old',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:OldPass1',
          approvalTokenHash: hashApprovalToken('old-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: new Date(now.getTime() - 60_000),
        },
        {
          id: 'pending-new',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: hashApprovalToken('new-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    await expect(
      approvePendingPasswordSetup(deps, 'old-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('resend rotates the approval token and expiry while preserving the pending password hash', async () => {
    const originalTokenHash = hashApprovalToken('original-token')
    const { deps, pendingRecords } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: originalTokenHash,
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })
    deps.generateToken = () => 'resend-token-456'
    const sendApprovalEmail = vi.fn()

    const result = await resendPendingPasswordChange(
      deps,
      'user-1',
      sendApprovalEmail,
      (token) => `https://console.test/password-setup/confirm?token=${token}`,
    )

    expect(result).toEqual({
      destinationEmail: 'user@example.com',
      expiresAt: new Date(now.getTime() + PENDING_PASSWORD_CHANGE_EXPIRY_MS),
    })
    expect(pendingRecords[0]).toMatchObject({
      pendingPasswordHash: 'hashed:ValidPass1',
      approvalTokenHash: hashApprovalToken('resend-token-456'),
      status: 'PENDING',
    })
    expect(sendApprovalEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'user@example.com',
      approvalUrl:
        'https://console.test/password-setup/confirm?token=resend-token-456',
      kind: 'SETUP',
    })
  })

  it('invalidates older approval links after resend', async () => {
    const { deps } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: hashApprovalToken('original-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })
    deps.generateToken = () => 'resend-token-456'

    await resendPendingPasswordChange(
      deps,
      'user-1',
      vi.fn(),
      (token) => `https://console.test/password-setup/confirm?token=${token}`,
    )

    expect(await inspectPendingPasswordChange(deps, 'original-token')).toEqual({
      valid: false,
      canReturnToProfile: false,
    })
    await expect(
      approvePendingPasswordSetup(deps, 'original-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('cancels an active pending request without current-password proof', async () => {
    const { deps, pendingRecords } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: hashApprovalToken('cancel-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    const result = await cancelPendingPasswordChange(deps, 'user-1')

    expect(result).toEqual({ cancelled: true })
    expect(pendingRecords[0]).toMatchObject({
      status: 'CANCELLED',
      cancelledAt: now,
    })
  })

  it('prevents approval after cancellation', async () => {
    const { deps } = createDeps({
      account: null,
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'SETUP',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:ValidPass1',
          approvalTokenHash: hashApprovalToken('cancel-token'),
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    await cancelPendingPasswordChange(deps, 'user-1')

    expect(await inspectPendingPasswordChange(deps, 'cancel-token')).toEqual({
      valid: false,
      canReturnToProfile: false,
    })
    await expect(
      approvePendingPasswordSetup(deps, 'cancel-token'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('creates a pending change request after current-password proof', async () => {
    const { deps, pendingRecords } = createDeps({
      account: {
        id: 'credential-1',
        providerId: 'credential',
        password: 'stored-hash',
      },
    })
    const sendApprovalEmail = vi.fn()

    const result = await createPendingPasswordChange(
      deps,
      {
        ...baseInput,
        currentPassword: 'CurrentPass1',
        newPassword: 'ValidPass1',
      },
      sendApprovalEmail,
      (token) => `https://console.test/password-setup/confirm?token=${token}`,
    )

    expect(result).toEqual({
      destinationEmail: 'user@example.com',
      expiresAt: new Date(now.getTime() + PENDING_PASSWORD_CHANGE_EXPIRY_MS),
    })
    expect(sendApprovalEmail).toHaveBeenCalledOnce()
    expect(pendingRecords[0]).toMatchObject({
      kind: 'CHANGE',
      status: 'PENDING',
      pendingPasswordHash: 'opaque-password-hash',
      approvalTokenHash: hashApprovalToken('raw-token-123'),
      destinationEmail: 'user@example.com',
    })
    expect(JSON.stringify(pendingRecords)).not.toContain('ValidPass1')
    expect(JSON.stringify(pendingRecords)).not.toContain('CurrentPass1')
  })

  it('does not create a pending change or send email when current-password proof fails', async () => {
    const { deps, pendingRecords } = createDeps({
      account: {
        id: 'credential-1',
        providerId: 'credential',
        password: 'stored-hash',
      },
    })
    const sendApprovalEmail = vi.fn()

    await expect(
      createPendingPasswordChange(
        deps,
        {
          ...baseInput,
          currentPassword: 'WrongPass1',
          newPassword: 'ValidPass1',
        },
        sendApprovalEmail,
        (token) => `https://console.test/password-setup/confirm?token=${token}`,
      ),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

    expect(pendingRecords).toHaveLength(0)
    expect(sendApprovalEmail).not.toHaveBeenCalled()
  })

  it('approves a valid change token, preserves the initiating session, and revokes others', async () => {
    const approvalTokenHash = hashApprovalToken('change-token')
    const { deps, session, accounts } = createDeps({
      account: {
        id: 'credential-1',
        providerId: 'credential',
        password: 'old-hash',
      },
      pendingRecords: [
        {
          id: 'pending-1',
          userId: 'user-1',
          kind: 'CHANGE',
          status: 'PENDING',
          pendingPasswordHash: 'hashed:NewPass1',
          approvalTokenHash,
          initiatingSessionId: 'session-1',
          destinationEmail: 'user@example.com',
          expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
          createdAt: now,
        },
      ],
    })

    const result = await approvePendingPasswordChange(deps, 'change-token')

    expect(result).toEqual({ approved: true })
    expect(session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        id: { not: 'session-1' },
      },
    })
    expect(
      accounts.find((item) => item.providerId === 'credential')?.password,
    ).toBe('hashed:NewPass1')
  })

  it('detects whether a user already has a password', async () => {
    const withPassword = createDeps({
      account: {
        id: 'credential-1',
        providerId: 'credential',
        password: 'hash',
      },
    })
    const withoutPassword = createDeps({ account: null })

    expect(await userHasPassword(withPassword.deps.account, 'user-1')).toBe(
      true,
    )
    expect(await userHasPassword(withoutPassword.deps.account, 'user-1')).toBe(
      false,
    )
  })
})

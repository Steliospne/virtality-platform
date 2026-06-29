import { createHash, randomBytes } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { hashPassword } from '@virtality/auth/lib/password'
import {
  collectPasswordIssues,
  createRandomStringGenerator,
  INVALID_APPROVAL_LINK_MESSAGE,
} from '@virtality/shared/utils'

export const PENDING_PASSWORD_CHANGE_EXPIRY_MS = 30 * 60 * 1000

export type PendingPasswordChangeKind = 'SETUP' | 'CHANGE'
export type PendingPasswordChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'CANCELLED'
  | 'SUPERSEDED'

export type PendingPasswordChangeDeps = Pick<
  PrismaClient,
  'pendingPasswordChange' | 'account' | 'session'
> & {
  now?: () => Date
  hashPasswordFn?: (password: string) => Promise<string>
  generateToken?: () => string
  generateId?: () => string
}

export type ActivePendingPasswordChange = {
  id: string
  kind: PendingPasswordChangeKind
  destinationEmail: string
  expiresAt: Date
}

export type InspectPendingPasswordChangeResult =
  | { valid: true; kind: PendingPasswordChangeKind }
  | { valid: false }

export type CreatePendingPasswordSetupInput = {
  userId: string
  email: string
  emailVerified: boolean
  newPassword: string
  initiatingSessionId: string
}

export type CreatePendingPasswordSetupResult = {
  destinationEmail: string
  expiresAt: Date
}

const generateApprovalToken = createRandomStringGenerator('a-z', 'A-Z', '0-9')

export function hashApprovalToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

export function assertPasswordPolicy(password: string) {
  const issues = collectPasswordIssues(password)

  if (issues.length > 0) {
    throw new ORPCError('BAD_REQUEST', {
      message: issues.map((issue) => issue.message).join('\n'),
    })
  }
}

export async function userHasPassword(
  account: PendingPasswordChangeDeps['account'],
  userId: string,
): Promise<boolean> {
  const credentialAccount = await account.findFirst({
    where: { userId, providerId: 'credential' },
    select: { password: true },
  })

  return !!credentialAccount?.password
}

async function supersedePendingRequests(
  pendingPasswordChange: PendingPasswordChangeDeps['pendingPasswordChange'],
  userId: string,
  now: Date,
) {
  await pendingPasswordChange.updateMany({
    where: { userId, status: 'PENDING' },
    data: { status: 'SUPERSEDED', supersededAt: now },
  })
}

export async function createPendingPasswordSetup(
  deps: PendingPasswordChangeDeps,
  input: CreatePendingPasswordSetupInput,
  sendApprovalEmail: (data: {
    email: string
    name: string
    approvalUrl: string
  }) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<CreatePendingPasswordSetupResult> {
  const now = deps.now?.() ?? new Date()

  assertPasswordPolicy(input.newPassword)

  if (!input.emailVerified) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Primary email must be verified before setting a password.',
    })
  }

  if (await userHasPassword(deps.account, input.userId)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Password is already set for this account.',
    })
  }

  const pendingPasswordHash = await (deps.hashPasswordFn ?? hashPassword)(
    input.newPassword,
  )
  const rawToken = deps.generateToken?.() ?? generateApprovalToken(32)
  const approvalTokenHash = hashApprovalToken(rawToken)
  const expiresAt = new Date(now.getTime() + PENDING_PASSWORD_CHANGE_EXPIRY_MS)

  await supersedePendingRequests(deps.pendingPasswordChange, input.userId, now)

  await deps.pendingPasswordChange.create({
    data: {
      id: deps.generateId?.() ?? randomBytes(12).toString('hex'),
      userId: input.userId,
      kind: 'SETUP',
      status: 'PENDING',
      pendingPasswordHash,
      approvalTokenHash,
      initiatingSessionId: input.initiatingSessionId,
      destinationEmail: input.email,
      expiresAt,
    },
  })

  const approvalUrl = buildApprovalUrl(rawToken)

  await sendApprovalEmail({
    email: input.email,
    name: input.email,
    approvalUrl,
  })

  return {
    destinationEmail: input.email,
    expiresAt,
  }
}

export async function getActivePendingPasswordChange(
  deps: Pick<PendingPasswordChangeDeps, 'pendingPasswordChange' | 'now'>,
  userId: string,
): Promise<ActivePendingPasswordChange | null> {
  const now = deps.now?.() ?? new Date()
  const pending = await deps.pendingPasswordChange.findFirst({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!pending || pending.expiresAt <= now) {
    return null
  }

  return {
    id: pending.id,
    kind: pending.kind,
    destinationEmail: pending.destinationEmail,
    expiresAt: pending.expiresAt,
  }
}

async function findValidPendingByToken(
  deps: PendingPasswordChangeDeps,
  token: string,
) {
  const now = deps.now?.() ?? new Date()
  const approvalTokenHash = hashApprovalToken(token)
  const pending = await deps.pendingPasswordChange.findFirst({
    where: { approvalTokenHash, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!pending || pending.expiresAt <= now) {
    return null
  }

  const latestPending = await deps.pendingPasswordChange.findFirst({
    where: { userId: pending.userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!latestPending || latestPending.id !== pending.id) {
    return null
  }

  return pending
}

export async function inspectPendingPasswordChange(
  deps: PendingPasswordChangeDeps,
  token: string,
): Promise<InspectPendingPasswordChangeResult> {
  const pending = await findValidPendingByToken(deps, token)
  if (!pending) {
    return { valid: false }
  }

  return { valid: true, kind: pending.kind }
}

export async function approvePendingPasswordSetup(
  deps: PendingPasswordChangeDeps,
  token: string,
): Promise<{ approved: true }> {
  const now = deps.now?.() ?? new Date()
  const pending = await findValidPendingByToken(deps, token)

  if (!pending || pending.kind !== 'SETUP') {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  if (await userHasPassword(deps.account, pending.userId)) {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  const credentialAccount = await deps.account.findFirst({
    where: { userId: pending.userId, providerId: 'credential' },
    select: { id: true, password: true },
  })

  if (credentialAccount) {
    await deps.account.update({
      where: { id: credentialAccount.id },
      data: { password: pending.pendingPasswordHash, updatedAt: now },
    })
  } else {
    await deps.account.create({
      data: {
        id: deps.generateId?.() ?? randomBytes(12).toString('hex'),
        userId: pending.userId,
        providerId: 'credential',
        accountId: pending.userId,
        password: pending.pendingPasswordHash,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  await deps.pendingPasswordChange.update({
    where: { id: pending.id },
    data: { status: 'APPROVED', approvedAt: now },
  })

  return { approved: true }
}

export function pendingPasswordChangePersistencePayload(input: {
  pendingPasswordHash: string
  approvalTokenHash: string
  destinationEmail: string
}) {
  return input
}

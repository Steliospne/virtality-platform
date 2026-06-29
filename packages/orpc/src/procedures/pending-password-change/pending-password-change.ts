import { createHash, randomBytes } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { hashPassword, verifyPassword } from '@virtality/auth/lib/password'
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
  verifyPasswordFn?: (input: {
    hash: string
    password: string
  }) => Promise<boolean>
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
  | { valid: false; canReturnToProfile: boolean }

export type CreatePendingPasswordSetupInput = {
  userId: string
  email: string
  emailVerified: boolean
  newPassword: string
  initiatingSessionId: string
}

export type PendingPasswordChangeOutcome = {
  destinationEmail: string
  expiresAt: Date
}

export type ApprovalEmailData = {
  email: string
  name: string
  approvalUrl: string
  kind: PendingPasswordChangeKind
}

export type CreatePendingPasswordChangeInput = {
  userId: string
  email: string
  emailVerified: boolean
  currentPassword: string
  newPassword: string
  initiatingSessionId: string
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

async function persistPendingPasswordRequest(
  deps: PendingPasswordChangeDeps,
  input: {
    userId: string
    email: string
    kind: PendingPasswordChangeKind
    newPassword: string
    initiatingSessionId: string
  },
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingPasswordChangeOutcome> {
  const now = deps.now?.() ?? new Date()
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
      kind: input.kind,
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
    kind: input.kind,
  })

  return {
    destinationEmail: input.email,
    expiresAt,
  }
}

export async function createPendingPasswordSetup(
  deps: PendingPasswordChangeDeps,
  input: CreatePendingPasswordSetupInput,
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingPasswordChangeOutcome> {
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

  return persistPendingPasswordRequest(
    deps,
    {
      userId: input.userId,
      email: input.email,
      kind: 'SETUP',
      newPassword: input.newPassword,
      initiatingSessionId: input.initiatingSessionId,
    },
    sendApprovalEmail,
    buildApprovalUrl,
  )
}

export async function createPendingPasswordChange(
  deps: PendingPasswordChangeDeps,
  input: CreatePendingPasswordChangeInput,
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingPasswordChangeOutcome> {
  assertPasswordPolicy(input.newPassword)

  if (!input.emailVerified) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Primary email must be verified before changing your password.',
    })
  }

  const credentialAccount = await deps.account.findFirst({
    where: { userId: input.userId, providerId: 'credential' },
    select: { password: true },
  })

  if (!credentialAccount?.password) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'No password is set for this account.',
    })
  }

  const currentPasswordValid = await (deps.verifyPasswordFn ?? verifyPassword)({
    hash: credentialAccount.password,
    password: input.currentPassword,
  })

  if (!currentPasswordValid) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Current password is incorrect.',
    })
  }

  return persistPendingPasswordRequest(
    deps,
    {
      userId: input.userId,
      email: input.email,
      kind: 'CHANGE',
      newPassword: input.newPassword,
      initiatingSessionId: input.initiatingSessionId,
    },
    sendApprovalEmail,
    buildApprovalUrl,
  )
}

async function findActivePendingRecord(
  pendingPasswordChange: PendingPasswordChangeDeps['pendingPasswordChange'],
  userId: string,
  now: Date,
) {
  const pending = await pendingPasswordChange.findFirst({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!pending || pending.expiresAt <= now) {
    return null
  }

  return pending
}

export async function resendPendingPasswordChange(
  deps: PendingPasswordChangeDeps,
  userId: string,
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingPasswordChangeOutcome> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingPasswordChange,
    userId,
    now,
  )

  if (!pending) {
    throw new ORPCError('NOT_FOUND', {
      message: 'No pending password change request found.',
    })
  }

  const rawToken = deps.generateToken?.() ?? generateApprovalToken(32)
  const approvalTokenHash = hashApprovalToken(rawToken)
  const expiresAt = new Date(now.getTime() + PENDING_PASSWORD_CHANGE_EXPIRY_MS)

  await deps.pendingPasswordChange.update({
    where: { id: pending.id },
    data: {
      approvalTokenHash,
      expiresAt,
    },
  })

  const approvalUrl = buildApprovalUrl(rawToken)

  await sendApprovalEmail({
    email: pending.destinationEmail,
    name: pending.destinationEmail,
    approvalUrl,
    kind: pending.kind,
  })

  return {
    destinationEmail: pending.destinationEmail,
    expiresAt,
  }
}

export async function cancelPendingPasswordChange(
  deps: Pick<PendingPasswordChangeDeps, 'pendingPasswordChange' | 'now'>,
  userId: string,
): Promise<{ cancelled: true }> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingPasswordChange,
    userId,
    now,
  )

  if (!pending) {
    throw new ORPCError('NOT_FOUND', {
      message: 'No pending password change request found.',
    })
  }

  await deps.pendingPasswordChange.update({
    where: { id: pending.id },
    data: { status: 'CANCELLED', cancelledAt: now },
  })

  return { cancelled: true }
}

export async function getActivePendingPasswordChange(
  deps: Pick<PendingPasswordChangeDeps, 'pendingPasswordChange' | 'now'>,
  userId: string,
): Promise<ActivePendingPasswordChange | null> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingPasswordChange,
    userId,
    now,
  )

  if (!pending) {
    return null
  }

  return {
    id: pending.id,
    kind: pending.kind,
    destinationEmail: pending.destinationEmail,
    expiresAt: pending.expiresAt,
  }
}

async function findPendingByTokenHash(
  pendingPasswordChange: PendingPasswordChangeDeps['pendingPasswordChange'],
  token: string,
) {
  const approvalTokenHash = hashApprovalToken(token)
  return pendingPasswordChange.findFirst({
    where: { approvalTokenHash },
    orderBy: { createdAt: 'desc' },
  })
}

async function validatePendingTokenRecord(
  deps: PendingPasswordChangeDeps,
  pending: NonNullable<Awaited<ReturnType<typeof findPendingByTokenHash>>>,
) {
  const now = deps.now?.() ?? new Date()

  if (pending.status !== 'PENDING' || pending.expiresAt <= now) {
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

async function findValidPendingByToken(
  deps: PendingPasswordChangeDeps,
  token: string,
) {
  const record = await findPendingByTokenHash(deps.pendingPasswordChange, token)
  if (!record) {
    return null
  }

  return validatePendingTokenRecord(deps, record)
}

export async function inspectPendingPasswordChange(
  deps: PendingPasswordChangeDeps,
  token: string,
  viewerUserId?: string,
): Promise<InspectPendingPasswordChangeResult> {
  const record = await findPendingByTokenHash(deps.pendingPasswordChange, token)
  const validPending = record
    ? await validatePendingTokenRecord(deps, record)
    : null

  if (validPending) {
    return { valid: true, kind: validPending.kind }
  }

  const canReturnToProfile =
    viewerUserId !== undefined && record?.userId === viewerUserId

  return { valid: false, canReturnToProfile }
}

type ValidatedPendingRecord = NonNullable<
  Awaited<ReturnType<typeof findValidPendingByToken>>
>

async function approveValidatedPendingSetup(
  deps: PendingPasswordChangeDeps,
  pending: ValidatedPendingRecord,
): Promise<{ approved: true }> {
  const now = deps.now?.() ?? new Date()

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

export async function approvePendingPasswordSetup(
  deps: PendingPasswordChangeDeps,
  token: string,
): Promise<{ approved: true }> {
  const pending = await findValidPendingByToken(deps, token)

  if (!pending || pending.kind !== 'SETUP') {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  return approveValidatedPendingSetup(deps, pending)
}

export async function approvePendingPasswordChange(
  deps: PendingPasswordChangeDeps,
  token: string,
): Promise<{ approved: true }> {
  const now = deps.now?.() ?? new Date()
  const pending = await findValidPendingByToken(deps, token)

  if (!pending) {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  if (pending.kind === 'SETUP') {
    return approveValidatedPendingSetup(deps, pending)
  }

  const credentialAccount = await deps.account.findFirst({
    where: { userId: pending.userId, providerId: 'credential' },
    select: { id: true, password: true },
  })

  if (!credentialAccount?.password) {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  await deps.account.update({
    where: { id: credentialAccount.id },
    data: { password: pending.pendingPasswordHash, updatedAt: now },
  })

  await deps.session.deleteMany({
    where: {
      userId: pending.userId,
      id: { not: pending.initiatingSessionId ?? '' },
    },
  })

  await deps.pendingPasswordChange.update({
    where: { id: pending.id },
    data: { status: 'APPROVED', approvedAt: now },
  })

  return { approved: true }
}

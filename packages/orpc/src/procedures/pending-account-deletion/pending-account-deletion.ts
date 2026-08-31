import { createHash, randomBytes } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  createRandomStringGenerator,
  INVALID_APPROVAL_LINK_MESSAGE,
} from '@virtality/shared/utils'

export const PENDING_ACCOUNT_DELETION_EXPIRY_MS = 30 * 60 * 1000

export type PendingAccountDeletionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'CANCELLED'
  | 'SUPERSEDED'

export type PendingAccountDeletionDeps = Pick<
  PrismaClient,
  'pendingAccountDeletion' | 'user' | 'session'
> & {
  now?: () => Date
  generateToken?: () => string
  generateId?: () => string
}

export type ActivePendingAccountDeletion = {
  id: string
  destinationEmail: string
  expiresAt: Date
}

export type InspectPendingAccountDeletionResult =
  | { valid: true }
  | { valid: false; canReturnToProfile: boolean }

export type CreatePendingAccountDeletionInput = {
  userId: string
  email: string
  initiatingSessionId: string
}

export type PendingAccountDeletionOutcome = {
  destinationEmail: string
  expiresAt: Date
}

export type ApprovalEmailData = {
  email: string
  name: string
  approvalUrl: string
}

const generateApprovalToken = createRandomStringGenerator('a-z', 'A-Z', '0-9')

export function hashApprovalToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url')
}

/**
 * Frees the unique `email`/`image` columns so the address can be reused by a
 * new sign-up, mirroring the Device soft-delete convention of nulling the
 * unique key rather than the row itself.
 */
export function buildDeletedAccountEmail(userId: string): string {
  return `deleted+${userId}@deleted.virtality.invalid`
}

async function supersedePendingRequests(
  pendingAccountDeletion: PendingAccountDeletionDeps['pendingAccountDeletion'],
  userId: string,
  now: Date,
) {
  await pendingAccountDeletion.updateMany({
    where: { userId, status: 'PENDING' },
    data: { status: 'SUPERSEDED', supersededAt: now },
  })
}

async function findActivePendingRecord(
  pendingAccountDeletion: PendingAccountDeletionDeps['pendingAccountDeletion'],
  userId: string,
  now: Date,
) {
  const pending = await pendingAccountDeletion.findFirst({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!pending || pending.expiresAt <= now) {
    return null
  }

  return pending
}

export async function createPendingAccountDeletion(
  deps: PendingAccountDeletionDeps,
  input: CreatePendingAccountDeletionInput,
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingAccountDeletionOutcome> {
  const now = deps.now?.() ?? new Date()
  const rawToken = deps.generateToken?.() ?? generateApprovalToken(32)
  const approvalTokenHash = hashApprovalToken(rawToken)
  const expiresAt = new Date(now.getTime() + PENDING_ACCOUNT_DELETION_EXPIRY_MS)

  await supersedePendingRequests(deps.pendingAccountDeletion, input.userId, now)

  await deps.pendingAccountDeletion.create({
    data: {
      id: deps.generateId?.() ?? randomBytes(12).toString('hex'),
      userId: input.userId,
      status: 'PENDING',
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

export async function resendPendingAccountDeletion(
  deps: PendingAccountDeletionDeps,
  userId: string,
  sendApprovalEmail: (data: ApprovalEmailData) => Promise<void>,
  buildApprovalUrl: (token: string) => string,
): Promise<PendingAccountDeletionOutcome> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingAccountDeletion,
    userId,
    now,
  )

  if (!pending) {
    throw new ORPCError('NOT_FOUND', {
      message: 'No pending account deletion request found.',
    })
  }

  const rawToken = deps.generateToken?.() ?? generateApprovalToken(32)
  const approvalTokenHash = hashApprovalToken(rawToken)
  const expiresAt = new Date(now.getTime() + PENDING_ACCOUNT_DELETION_EXPIRY_MS)

  await deps.pendingAccountDeletion.update({
    where: { id: pending.id },
    data: { approvalTokenHash, expiresAt },
  })

  const approvalUrl = buildApprovalUrl(rawToken)

  await sendApprovalEmail({
    email: pending.destinationEmail,
    name: pending.destinationEmail,
    approvalUrl,
  })

  return {
    destinationEmail: pending.destinationEmail,
    expiresAt,
  }
}

export async function cancelPendingAccountDeletion(
  deps: Pick<PendingAccountDeletionDeps, 'pendingAccountDeletion' | 'now'>,
  userId: string,
): Promise<{ cancelled: true }> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingAccountDeletion,
    userId,
    now,
  )

  if (!pending) {
    throw new ORPCError('NOT_FOUND', {
      message: 'No pending account deletion request found.',
    })
  }

  await deps.pendingAccountDeletion.update({
    where: { id: pending.id },
    data: { status: 'CANCELLED', cancelledAt: now },
  })

  return { cancelled: true }
}

export async function getActivePendingAccountDeletion(
  deps: Pick<PendingAccountDeletionDeps, 'pendingAccountDeletion' | 'now'>,
  userId: string,
): Promise<ActivePendingAccountDeletion | null> {
  const now = deps.now?.() ?? new Date()
  const pending = await findActivePendingRecord(
    deps.pendingAccountDeletion,
    userId,
    now,
  )

  if (!pending) {
    return null
  }

  return {
    id: pending.id,
    destinationEmail: pending.destinationEmail,
    expiresAt: pending.expiresAt,
  }
}

async function findPendingByTokenHash(
  pendingAccountDeletion: PendingAccountDeletionDeps['pendingAccountDeletion'],
  token: string,
) {
  const approvalTokenHash = hashApprovalToken(token)
  return pendingAccountDeletion.findFirst({
    where: { approvalTokenHash },
    orderBy: { createdAt: 'desc' },
  })
}

async function validatePendingTokenRecord(
  deps: PendingAccountDeletionDeps,
  pending: NonNullable<Awaited<ReturnType<typeof findPendingByTokenHash>>>,
) {
  const now = deps.now?.() ?? new Date()

  if (pending.status !== 'PENDING' || pending.expiresAt <= now) {
    return null
  }

  const latestPending = await deps.pendingAccountDeletion.findFirst({
    where: { userId: pending.userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  if (!latestPending || latestPending.id !== pending.id) {
    return null
  }

  return pending
}

async function findValidPendingByToken(
  deps: PendingAccountDeletionDeps,
  token: string,
) {
  const record = await findPendingByTokenHash(
    deps.pendingAccountDeletion,
    token,
  )
  if (!record) {
    return null
  }

  return validatePendingTokenRecord(deps, record)
}

export async function inspectPendingAccountDeletion(
  deps: PendingAccountDeletionDeps,
  token: string,
  viewerUserId?: string,
): Promise<InspectPendingAccountDeletionResult> {
  const record = await findPendingByTokenHash(
    deps.pendingAccountDeletion,
    token,
  )
  const validPending = record
    ? await validatePendingTokenRecord(deps, record)
    : null

  if (validPending) {
    return { valid: true }
  }

  const canReturnToProfile =
    viewerUserId !== undefined && record?.userId === viewerUserId

  return { valid: false, canReturnToProfile }
}

export async function approvePendingAccountDeletion(
  deps: PendingAccountDeletionDeps,
  token: string,
): Promise<{ approved: true; userId: string }> {
  const now = deps.now?.() ?? new Date()
  const pending = await findValidPendingByToken(deps, token)

  if (!pending) {
    throw new ORPCError('BAD_REQUEST', {
      message: INVALID_APPROVAL_LINK_MESSAGE,
    })
  }

  await deps.pendingAccountDeletion.update({
    where: { id: pending.id },
    data: { status: 'APPROVED', approvedAt: now },
  })

  await deps.user.update({
    where: { id: pending.userId },
    data: {
      deletedAt: now,
      banned: true,
      banReason: 'Account deleted by user request.',
      email: buildDeletedAccountEmail(pending.userId),
      image: null,
    },
  })

  await deps.session.deleteMany({ where: { userId: pending.userId } })

  return { approved: true, userId: pending.userId }
}

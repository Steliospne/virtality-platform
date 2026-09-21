import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { sendEmail } from '@virtality/nodemailer'
import {
  deliverIndividualEmails,
  generateUUID,
  parseEmailBodyBlocksJson,
  parseRenderedEmailSnapshotJson,
  serializeRenderedEmailSnapshotJson,
  buildArchiveDraftData,
  buildDraftUpdateData,
  buildRestoreDraftData,
  draftHasFinalSend,
  isDraftArchived,
  getDraftSendReadiness,
  parseDraftBodyBlocks,
  validateDraftBodyBlocksInput,
  validateDraftRecipientsInput,
  validateFinalSendConfirmation,
  validateTestSendContent,
} from '@virtality/shared/utils'
import {
  adminEmailTopicSchema,
  emailBodyBlocksSchema,
  type AdminEmailTopic,
  type EmailBodyBlock,
} from '@virtality/shared/types'
import { renderAdminAuthoredEmail } from '@virtality/ui/render-admin-authored-email'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'
import {
  buildOptOutPlaceholderLinks,
  personaliseOptOutLinks,
} from './admin-authored-email/opt-out-links.ts'
import {
  resolveDraftRecipientsFromDb,
  type AudienceRow,
} from './admin-authored-email/recipient-resolution.ts'

const draftIdInput = z.object({
  draftId: z.string().min(1),
})

const updateDraftInput = z.object({
  draftId: z.string().min(1),
  subject: z.string().optional(),
  previewText: z.string().nullable().optional(),
  bodyBlocks: emailBodyBlocksSchema.optional(),
  recipients: z.array(z.string()).optional(),
  audienceId: z.string().min(1).nullable().optional(),
  topic: adminEmailTopicSchema.optional(),
})

const cloneDraftInput = z.object({
  draftId: z.string().min(1),
})

const cloneSentRecordInput = z.object({
  sentRecordId: z.string().min(1),
})

const testSendInput = z.object({
  draftId: z.string().min(1),
  testRecipientEmail: z.string().email(),
})

const finalSendInput = z.object({
  draftId: z.string().min(1),
  confirmedSubject: z.string(),
  confirmedRecipientCount: z.number().int().nonnegative(),
})

const sentRecordIdInput = z.object({
  sentRecordId: z.string().min(1),
})

const audienceSelect = {
  id: true,
  name: true,
  ruleJson: true,
  includeEmails: true,
  excludeEmails: true,
} as const

const draftInclude = {
  sentRecords: {
    select: { id: true },
  },
  audience: { select: audienceSelect },
} as const

const sentRecordInclude = {
  deliveryResults: {
    orderBy: { attemptedAt: 'asc' },
  },
} as const

type DraftWithSentRecords = {
  id: string
  subject: string
  previewText: string | null
  bodyBlocksJson: string
  recipients: string[]
  topic: AdminEmailTopic
  audienceId: string | null
  audience: AudienceRow | null
  hasSuccessfulTestSend: boolean
  lastTestSentAt: Date | null
  clonedFromDraftId: string | null
  clonedFromSentRecordId: string | null
  archivedAt: Date | null
  archivedById: string | null
  restoredAt: Date | null
  restoredById: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  sentRecords: { id: string }[]
}

const toDraftRecord = (draft: DraftWithSentRecords) => ({
  subject: draft.subject,
  previewText: draft.previewText,
  bodyBlocksJson: draft.bodyBlocksJson,
  recipients: draft.recipients,
  hasSuccessfulTestSend: draft.hasSuccessfulTestSend,
  sentRecordCount: draft.sentRecords.length,
  audienceId: draft.audienceId,
  topic: draft.topic,
})

const mapDraft = (draft: DraftWithSentRecords) => {
  const bodyBlocks = parseDraftBodyBlocks(toDraftRecord(draft))

  return {
    id: draft.id,
    subject: draft.subject,
    previewText: draft.previewText,
    bodyBlocks,
    recipients: draft.recipients,
    topic: draft.topic,
    audienceId: draft.audienceId,
    audienceName: draft.audience?.name ?? null,
    hasSuccessfulTestSend: draft.hasSuccessfulTestSend,
    lastTestSentAt: draft.lastTestSentAt,
    clonedFromDraftId: draft.clonedFromDraftId,
    clonedFromSentRecordId: draft.clonedFromSentRecordId,
    archivedAt: draft.archivedAt,
    archivedById: draft.archivedById,
    restoredAt: draft.restoredAt,
    restoredById: draft.restoredById,
    isArchived: isDraftArchived(draft),
    createdById: draft.createdById,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    isFinalSent: draftHasFinalSend(toDraftRecord(draft)),
    sendReadiness: getDraftSendReadiness(toDraftRecord(draft)),
  }
}

type SentRecordWithDeliveries = {
  id: string
  sourceDraftId: string | null
  subject: string
  previewText: string | null
  bodyBlocksJson: string
  renderedSnapshotJson: string
  topic: AdminEmailTopic
  audienceId: string | null
  audienceName: string | null
  recipients: string[]
  suppressedRecipients: string[]
  createdById: string
  sentById: string
  draftCreatedAt: Date
  sentAt: Date
  deliveryResults: {
    recipientEmail: string
    status: 'sent' | 'failed'
    errorMessage: string | null
    attemptedAt: Date
  }[]
}

const mapSentRecord = (sentRecord: SentRecordWithDeliveries) => ({
  id: sentRecord.id,
  sourceDraftId: sentRecord.sourceDraftId,
  subject: sentRecord.subject,
  previewText: sentRecord.previewText,
  bodyBlocks: parseEmailBodyBlocksJson(sentRecord.bodyBlocksJson),
  renderedSnapshot: parseRenderedEmailSnapshotJson(
    sentRecord.renderedSnapshotJson,
  ),
  topic: sentRecord.topic,
  audienceId: sentRecord.audienceId,
  audienceName: sentRecord.audienceName,
  recipients: sentRecord.recipients,
  suppressedRecipients: sentRecord.suppressedRecipients,
  createdById: sentRecord.createdById,
  sentById: sentRecord.sentById,
  draftCreatedAt: sentRecord.draftCreatedAt,
  sentAt: sentRecord.sentAt,
  deliveryResults: sentRecord.deliveryResults.map((result) => ({
    recipientEmail: result.recipientEmail,
    status: result.status,
    errorMessage: result.errorMessage,
    attemptedAt: result.attemptedAt,
  })),
})

const assertAudienceExists = async (
  prisma: PrismaClient,
  audienceId: string | null | undefined,
) => {
  if (!audienceId) {
    return
  }

  const audience = await prisma.emailAudience.findUnique({
    where: { id: audienceId },
    select: { id: true },
  })

  if (!audience) {
    throw new ORPCError('NOT_FOUND', { message: 'Audience not found' })
  }
}

const getDraftOrThrow = async (prisma: PrismaClient, draftId: string) => {
  const draft = await prisma.adminEmailDraft.findUnique({
    where: { id: draftId },
    include: draftInclude,
  })

  if (!draft) {
    throw new ORPCError('NOT_FOUND', { message: 'Email draft not found' })
  }

  return draft
}

const assertDraftEditable = (draft: DraftWithSentRecords) => {
  if (isDraftArchived(draft)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Email draft is archived and cannot be changed',
    })
  }

  if (draftHasFinalSend(toDraftRecord(draft))) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Email draft has been final-sent and cannot be changed',
    })
  }
}

const renderDraft = async (
  draft: DraftWithSentRecords,
  options: { withOptOutFooter: boolean } = { withOptOutFooter: true },
) => {
  const bodyBlocks = parseDraftBodyBlocks(toDraftRecord(draft))

  const rendered = await renderAdminAuthoredEmail({
    subject: draft.subject,
    previewText: draft.previewText ?? undefined,
    bodyBlocks: bodyBlocks as EmailBodyBlock[],
    optOut: options.withOptOutFooter
      ? buildOptOutPlaceholderLinks(draft.topic)
      : undefined,
  })

  return {
    subject: draft.subject,
    html: rendered.html,
    previewText: draft.previewText ?? undefined,
  }
}

const listDrafts = authed
  .route({ path: '/email/admin-authored/drafts/list', method: 'GET' })
  .handler(async ({ context }) => {
    const drafts = await context.prisma.adminEmailDraft.findMany({
      where: { archivedAt: null },
      include: draftInclude,
      orderBy: { updatedAt: 'desc' },
    })

    return drafts.map(mapDraft)
  })

const listArchivedDrafts = authed
  .route({ path: '/email/admin-authored/drafts/list-archived', method: 'GET' })
  .handler(async ({ context }) => {
    const drafts = await context.prisma.adminEmailDraft.findMany({
      where: { archivedAt: { not: null } },
      include: draftInclude,
      orderBy: { archivedAt: 'desc' },
    })

    return drafts.map(mapDraft)
  })

const getDraft = authed
  .route({ path: '/email/admin-authored/drafts/get', method: 'GET' })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    return mapDraft(draft)
  })

const createDraft = authed
  .route({ path: '/email/admin-authored/drafts/create', method: 'POST' })
  .handler(async ({ context }) => {
    const draft = await context.prisma.adminEmailDraft.create({
      data: {
        id: generateUUID(),
        subject: '',
        bodyBlocksJson: '[]',
        recipients: [],
        createdById: context.user.id,
      },
      include: draftInclude,
    })

    return mapDraft(draft)
  })

const updateDraft = authed
  .route({ path: '/email/admin-authored/drafts/update', method: 'POST' })
  .input(updateDraftInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    assertDraftEditable(draft)

    const recipientError = validateDraftRecipientsInput(input.recipients)
    if (recipientError) {
      throw new ORPCError('BAD_REQUEST', { message: recipientError })
    }

    const bodyBlocksError = validateDraftBodyBlocksInput(input.bodyBlocks)
    if (bodyBlocksError) {
      throw new ORPCError('BAD_REQUEST', { message: bodyBlocksError })
    }

    await assertAudienceExists(context.prisma, input.audienceId)

    const updated = await context.prisma.adminEmailDraft.update({
      where: { id: input.draftId },
      data: buildDraftUpdateData(toDraftRecord(draft), {
        subject: input.subject,
        previewText: input.previewText,
        bodyBlocks: input.bodyBlocks,
        recipients: input.recipients,
        audienceId: input.audienceId,
        topic: input.topic,
      }),
      include: draftInclude,
    })

    return mapDraft(updated)
  })

const cloneDraft = authed
  .route({ path: '/email/admin-authored/drafts/clone', method: 'POST' })
  .input(cloneDraftInput)
  .handler(async ({ context, input }) => {
    const source = await getDraftOrThrow(context.prisma, input.draftId)

    const cloned = await context.prisma.adminEmailDraft.create({
      data: {
        id: generateUUID(),
        subject: source.subject,
        previewText: source.previewText,
        bodyBlocksJson: source.bodyBlocksJson,
        recipients: source.recipients,
        topic: source.topic,
        audienceId: source.audienceId,
        hasSuccessfulTestSend: false,
        lastTestSentAt: null,
        clonedFromDraftId: source.id,
        createdById: context.user.id,
      },
      include: draftInclude,
    })

    return mapDraft(cloned)
  })

const cloneSentRecord = authed
  .route({
    path: '/email/admin-authored/drafts/clone-from-sent',
    method: 'POST',
  })
  .input(cloneSentRecordInput)
  .handler(async ({ context, input }) => {
    const sentRecord = await context.prisma.adminEmailSentRecord.findUnique({
      where: { id: input.sentRecordId },
    })

    if (!sentRecord) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Sent email record not found',
      })
    }

    // The Audience may have been deleted since the send; fall back to none.
    const audience = sentRecord.audienceId
      ? await context.prisma.emailAudience.findUnique({
          where: { id: sentRecord.audienceId },
          select: { id: true },
        })
      : null

    const cloned = await context.prisma.adminEmailDraft.create({
      data: {
        id: generateUUID(),
        subject: sentRecord.subject,
        previewText: sentRecord.previewText,
        bodyBlocksJson: sentRecord.bodyBlocksJson,
        recipients: sentRecord.recipients,
        topic: sentRecord.topic,
        audienceId: audience?.id ?? null,
        hasSuccessfulTestSend: false,
        lastTestSentAt: null,
        clonedFromSentRecordId: sentRecord.id,
        createdById: context.user.id,
      },
      include: draftInclude,
    })

    return mapDraft(cloned)
  })

const archiveDraft = authed
  .route({ path: '/email/admin-authored/drafts/archive', method: 'POST' })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)

    if (isDraftArchived(draft)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Email draft is already archived',
      })
    }

    const archived = await context.prisma.adminEmailDraft.update({
      where: { id: input.draftId },
      data: buildArchiveDraftData(context.user.id),
      include: draftInclude,
    })

    return mapDraft(archived)
  })

const restoreDraft = authed
  .route({ path: '/email/admin-authored/drafts/restore', method: 'POST' })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)

    if (!isDraftArchived(draft)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Email draft is not archived',
      })
    }

    const restored = await context.prisma.adminEmailDraft.update({
      where: { id: input.draftId },
      data: buildRestoreDraftData(context.user.id),
      include: draftInclude,
    })

    return mapDraft(restored)
  })

const previewDraft = authed
  .route({ path: '/email/admin-authored/drafts/preview', method: 'GET' })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    return renderDraft(draft)
  })

const toResolvedRecipientsOutput = (
  resolved: Awaited<ReturnType<typeof resolveDraftRecipientsFromDb>>,
) => ({
  explicitCount: resolved.explicitCount,
  audienceCount: resolved.audienceCount,
  audienceName: resolved.audienceName,
  overlapCount: resolved.overlapCount,
  suppressedCount: resolved.suppressedCount,
  totalCount: resolved.totalCount,
  recipients: resolved.recipients,
  suppressed: resolved.suppressed,
})

/**
 * Same resolution as `resolveRecipients`, but for unsaved targeting so the
 * workspace can show live numbers while the admin edits.
 */
const previewDraftRecipients = authed
  .route({
    path: '/email/admin-authored/drafts/preview-recipients',
    method: 'POST',
  })
  .input(
    z.object({
      topic: adminEmailTopicSchema,
      audienceId: z.string().min(1).nullable(),
      recipients: z.array(z.string()),
    }),
  )
  .handler(async ({ context, input }) => {
    const audience = input.audienceId
      ? await context.prisma.emailAudience.findUnique({
          where: { id: input.audienceId },
          select: audienceSelect,
        })
      : null

    const resolved = await resolveDraftRecipientsFromDb(context.prisma, {
      recipients: input.recipients,
      topic: input.topic,
      audience,
    })

    return toResolvedRecipientsOutput(resolved)
  })

/** Explicit list ∪ Audience, minus Opt-outs — what Final Send would deliver to. */
const resolveDraftRecipients = authed
  .route({
    path: '/email/admin-authored/drafts/resolve-recipients',
    method: 'GET',
  })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    const resolved = await resolveDraftRecipientsFromDb(context.prisma, draft)

    return toResolvedRecipientsOutput(resolved)
  })

const testSendDraft = authed
  .route({ path: '/email/admin-authored/drafts/test-send', method: 'POST' })
  .input(testSendInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    assertDraftEditable(draft)

    const contentCheck = validateTestSendContent(toDraftRecord(draft))
    if (!contentCheck.ready) {
      throw new ORPCError('BAD_REQUEST', {
        message: contentCheck.reason ?? 'draft is not ready for test send',
      })
    }

    const rendered = await renderDraft(draft)
    const htmlFor = personaliseOptOutLinks(rendered.html, draft.topic)

    await sendEmail({
      to: input.testRecipientEmail,
      subject: rendered.subject,
      html: htmlFor(input.testRecipientEmail),
    })

    const updated = await context.prisma.adminEmailDraft.update({
      where: { id: input.draftId },
      data: {
        hasSuccessfulTestSend: true,
        lastTestSentAt: new Date(),
      },
      include: draftInclude,
    })

    return mapDraft(updated)
  })

const finalSendDraft = authed
  .route({ path: '/email/admin-authored/drafts/final-send', method: 'POST' })
  .input(finalSendInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    assertDraftEditable(draft)

    const draftRecord = toDraftRecord(draft)
    const sendReadiness = getDraftSendReadiness(draftRecord)
    if (!sendReadiness.ready) {
      throw new ORPCError('BAD_REQUEST', {
        message: sendReadiness.reasons.join('; '),
      })
    }

    const resolved = await resolveDraftRecipientsFromDb(context.prisma, draft)

    const confirmationError = validateFinalSendConfirmation(
      { subject: draft.subject, resolvedRecipientCount: resolved.totalCount },
      input,
    )
    if (confirmationError) {
      throw new ORPCError('BAD_REQUEST', { message: confirmationError })
    }

    if (resolved.totalCount === 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'no recipients remain after applying opt-outs',
      })
    }

    const rendered = await renderDraft(draft)
    const deliveryResults = await deliverIndividualEmails({
      recipients: resolved.recipients,
      subject: rendered.subject,
      html: personaliseOptOutLinks(rendered.html, draft.topic),
      sendEmail,
    })

    const sentRecordId = generateUUID()
    const sentRecord = await context.prisma.adminEmailSentRecord.create({
      data: {
        id: sentRecordId,
        sourceDraftId: draft.id,
        subject: draft.subject,
        previewText: draft.previewText,
        bodyBlocksJson: draft.bodyBlocksJson,
        renderedSnapshotJson: serializeRenderedEmailSnapshotJson(rendered),
        topic: draft.topic,
        audienceId: draft.audienceId,
        audienceName: resolved.audienceName,
        recipients: resolved.recipients,
        suppressedRecipients: resolved.suppressed,
        createdById: draft.createdById,
        sentById: context.user.id,
        draftCreatedAt: draft.createdAt,
        deliveryResults: {
          create: deliveryResults.map((result) => ({
            id: generateUUID(),
            recipientEmail: result.recipientEmail,
            status: result.status,
            errorMessage: result.errorMessage,
            attemptedAt: result.attemptedAt,
          })),
        },
      },
      include: sentRecordInclude,
    })

    return mapSentRecord(sentRecord)
  })

const listSentRecords = authed
  .route({ path: '/email/admin-authored/sent/list', method: 'GET' })
  .handler(async ({ context }) => {
    const sentRecords = await context.prisma.adminEmailSentRecord.findMany({
      include: sentRecordInclude,
      orderBy: { sentAt: 'desc' },
    })

    return sentRecords.map(mapSentRecord)
  })

const getSentRecord = authed
  .route({ path: '/email/admin-authored/sent/get', method: 'GET' })
  .input(sentRecordIdInput)
  .handler(async ({ context, input }) => {
    const sentRecord = await context.prisma.adminEmailSentRecord.findUnique({
      where: { id: input.sentRecordId },
      include: sentRecordInclude,
    })

    if (!sentRecord) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Sent email record not found',
      })
    }

    return mapSentRecord(sentRecord)
  })

export const adminAuthoredEmail = {
  drafts: {
    list: listDrafts,
    listArchived: listArchivedDrafts,
    get: getDraft,
    create: createDraft,
    update: updateDraft,
    clone: cloneDraft,
    cloneFromSent: cloneSentRecord,
    archive: archiveDraft,
    restore: restoreDraft,
    preview: previewDraft,
    resolveRecipients: resolveDraftRecipients,
    previewRecipients: previewDraftRecipients,
    testSend: testSendDraft,
    finalSend: finalSendDraft,
  },
  sentRecords: {
    list: listSentRecords,
    get: getSentRecord,
  },
}

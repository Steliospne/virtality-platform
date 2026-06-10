import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { sendEmail } from '@virtality/nodemailer'
import {
  deliverIndividualEmails,
  generateUUID,
  parseEmailBodyBlocksJson,
  parseRenderedEmailSnapshotJson,
  serializeRenderedEmailSnapshotJson,
  buildDraftUpdateData,
  draftHasFinalSend,
  getDraftSendReadiness,
  parseDraftBodyBlocks,
  validateDraftBodyBlocksInput,
  validateDraftRecipientsInput,
  validateFinalSendConfirmation,
  validateTestSendContent,
} from '@virtality/shared/utils'
import {
  emailBodyBlocksSchema,
  type EmailBodyBlock,
} from '@virtality/shared/types'
import { renderAdminAuthoredEmail } from '@virtality/ui/render-admin-authored-email'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'

const draftIdInput = z.object({
  draftId: z.string().min(1),
})

const updateDraftInput = z.object({
  draftId: z.string().min(1),
  subject: z.string().optional(),
  previewText: z.string().nullable().optional(),
  bodyBlocks: emailBodyBlocksSchema.optional(),
  recipients: z.array(z.string()).optional(),
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

const draftInclude = {
  sentRecords: {
    select: { id: true },
  },
} as const

type DraftWithSentRecords = {
  id: string
  subject: string
  previewText: string | null
  bodyBlocksJson: string
  recipients: string[]
  hasSuccessfulTestSend: boolean
  lastTestSentAt: Date | null
  clonedFromDraftId: string | null
  clonedFromSentRecordId: string | null
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
})

const mapDraft = (draft: DraftWithSentRecords) => {
  const bodyBlocks = parseDraftBodyBlocks(toDraftRecord(draft))

  return {
    id: draft.id,
    subject: draft.subject,
    previewText: draft.previewText,
    bodyBlocks,
    recipients: draft.recipients,
    hasSuccessfulTestSend: draft.hasSuccessfulTestSend,
    lastTestSentAt: draft.lastTestSentAt,
    clonedFromDraftId: draft.clonedFromDraftId,
    clonedFromSentRecordId: draft.clonedFromSentRecordId,
    createdById: draft.createdById,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    isFinalSent: draftHasFinalSend(toDraftRecord(draft)),
    sendReadiness: getDraftSendReadiness(toDraftRecord(draft)),
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
  if (draftHasFinalSend(toDraftRecord(draft))) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Email draft has been final-sent and cannot be changed',
    })
  }
}

const renderDraft = async (draft: DraftWithSentRecords) => {
  const bodyBlocks = parseDraftBodyBlocks(toDraftRecord(draft))

  const rendered = await renderAdminAuthoredEmail({
    subject: draft.subject,
    previewText: draft.previewText ?? undefined,
    bodyBlocks: bodyBlocks as EmailBodyBlock[],
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
      include: draftInclude,
      orderBy: { updatedAt: 'desc' },
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

    const updated = await context.prisma.adminEmailDraft.update({
      where: { id: input.draftId },
      data: buildDraftUpdateData(toDraftRecord(draft), {
        subject: input.subject,
        previewText: input.previewText,
        bodyBlocks: input.bodyBlocks,
        recipients: input.recipients,
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

    const cloned = await context.prisma.adminEmailDraft.create({
      data: {
        id: generateUUID(),
        subject: sentRecord.subject,
        previewText: sentRecord.previewText,
        bodyBlocksJson: sentRecord.bodyBlocksJson,
        recipients: sentRecord.recipients,
        hasSuccessfulTestSend: false,
        lastTestSentAt: null,
        clonedFromSentRecordId: sentRecord.id,
        createdById: context.user.id,
      },
      include: draftInclude,
    })

    return mapDraft(cloned)
  })

const previewDraft = authed
  .route({ path: '/email/admin-authored/drafts/preview', method: 'GET' })
  .input(draftIdInput)
  .handler(async ({ context, input }) => {
    const draft = await getDraftOrThrow(context.prisma, input.draftId)
    return renderDraft(draft)
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

    await sendEmail({
      to: input.testRecipientEmail,
      subject: rendered.subject,
      html: rendered.html,
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

    const confirmationError = validateFinalSendConfirmation(
      draftRecord,
      input,
    )
    if (confirmationError) {
      throw new ORPCError('BAD_REQUEST', { message: confirmationError })
    }

    const rendered = await renderDraft(draft)
    const deliveryResults = await deliverIndividualEmails({
      recipients: draft.recipients,
      subject: rendered.subject,
      html: rendered.html,
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
        recipients: draft.recipients,
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
      include: {
        deliveryResults: {
          orderBy: { attemptedAt: 'asc' },
        },
      },
    })

    return {
      id: sentRecord.id,
      sourceDraftId: sentRecord.sourceDraftId,
      subject: sentRecord.subject,
      previewText: sentRecord.previewText,
      bodyBlocks: parseEmailBodyBlocksJson(sentRecord.bodyBlocksJson),
      renderedSnapshot: parseRenderedEmailSnapshotJson(
        sentRecord.renderedSnapshotJson,
      ),
      recipients: sentRecord.recipients,
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
    }
  })

const listSentRecords = authed
  .route({ path: '/email/admin-authored/sent/list', method: 'GET' })
  .handler(async ({ context }) => {
    const sentRecords = await context.prisma.adminEmailSentRecord.findMany({
      include: {
        deliveryResults: {
          orderBy: { attemptedAt: 'asc' },
        },
      },
      orderBy: { sentAt: 'desc' },
    })

    return sentRecords.map((sentRecord) => ({
      id: sentRecord.id,
      sourceDraftId: sentRecord.sourceDraftId,
      subject: sentRecord.subject,
      previewText: sentRecord.previewText,
      bodyBlocks: parseEmailBodyBlocksJson(sentRecord.bodyBlocksJson),
      renderedSnapshot: parseRenderedEmailSnapshotJson(
        sentRecord.renderedSnapshotJson,
      ),
      recipients: sentRecord.recipients,
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
    }))
  })

const getSentRecord = authed
  .route({ path: '/email/admin-authored/sent/get', method: 'GET' })
  .input(sentRecordIdInput)
  .handler(async ({ context, input }) => {
    const sentRecord = await context.prisma.adminEmailSentRecord.findUnique({
      where: { id: input.sentRecordId },
      include: {
        deliveryResults: {
          orderBy: { attemptedAt: 'asc' },
        },
      },
    })

    if (!sentRecord) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Sent email record not found',
      })
    }

    return {
      id: sentRecord.id,
      sourceDraftId: sentRecord.sourceDraftId,
      subject: sentRecord.subject,
      previewText: sentRecord.previewText,
      bodyBlocks: parseEmailBodyBlocksJson(sentRecord.bodyBlocksJson),
      renderedSnapshot: parseRenderedEmailSnapshotJson(
        sentRecord.renderedSnapshotJson,
      ),
      recipients: sentRecord.recipients,
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
    }
  })

export const adminAuthoredEmail = {
  drafts: {
    list: listDrafts,
    get: getDraft,
    create: createDraft,
    update: updateDraft,
    clone: cloneDraft,
    cloneFromSent: cloneSentRecord,
    preview: previewDraft,
    testSend: testSendDraft,
    finalSend: finalSendDraft,
  },
  sentRecords: {
    list: listSentRecords,
    get: getSentRecord,
  },
}

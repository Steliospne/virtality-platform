import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import {
  emailAudienceRuleSchema,
  MAX_EMAIL_AUDIENCE_PINS,
} from '@virtality/shared/types'
import {
  generateUUID,
  normalizeEmailAddress,
  parseEmailAudienceRuleJson,
  serializeEmailAudienceRuleJson,
  validateEmailAudienceName,
  validateEmailAudiencePins,
} from '@virtality/shared/utils'
import { z } from 'zod'
import { authed } from '../middleware/auth.ts'
import { resolveAudienceFromDb } from './admin-authored-email/recipient-resolution.ts'

const audienceIdInput = z.object({ audienceId: z.string().min(1) })

const audienceFieldsInput = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  rule: emailAudienceRuleSchema,
  includeEmails: z.array(z.string()).max(MAX_EMAIL_AUDIENCE_PINS),
  excludeEmails: z.array(z.string()).max(MAX_EMAIL_AUDIENCE_PINS),
})

const audienceInclude = {
  drafts: { select: { id: true }, where: { archivedAt: null } },
} as const

type AudienceRow = {
  id: string
  name: string
  description: string | null
  ruleJson: string
  includeEmails: string[]
  excludeEmails: string[]
  createdById: string
  createdAt: Date
  updatedAt: Date
  drafts: { id: string }[]
}

const mapAudience = (audience: AudienceRow) => ({
  id: audience.id,
  name: audience.name,
  description: audience.description,
  rule: parseEmailAudienceRuleJson(audience.ruleJson),
  includeEmails: audience.includeEmails,
  excludeEmails: audience.excludeEmails,
  createdById: audience.createdById,
  createdAt: audience.createdAt,
  updatedAt: audience.updatedAt,
  attachedDraftCount: audience.drafts.length,
})

const normalizePins = (pins: string[]) => [
  ...new Set(pins.map(normalizeEmailAddress).filter(Boolean)),
]

const validateAudienceFields = (input: z.infer<typeof audienceFieldsInput>) => {
  const includeEmails = normalizePins(input.includeEmails)
  const excludeEmails = normalizePins(input.excludeEmails)

  const error =
    validateEmailAudienceName(input.name) ??
    validateEmailAudiencePins(includeEmails, 'include') ??
    validateEmailAudiencePins(excludeEmails, 'exclude')

  if (error) {
    throw new ORPCError('BAD_REQUEST', { message: error })
  }

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    ruleJson: serializeEmailAudienceRuleJson(input.rule),
    includeEmails,
    excludeEmails,
  }
}

const getAudienceOrThrow = async (prisma: PrismaClient, audienceId: string) => {
  const audience = await prisma.emailAudience.findUnique({
    where: { id: audienceId },
    include: audienceInclude,
  })

  if (!audience) {
    throw new ORPCError('NOT_FOUND', { message: 'Audience not found' })
  }

  return audience
}

const listAudiences = authed
  .route({ path: '/email/audiences/list', method: 'GET' })
  .handler(async ({ context }) => {
    const audiences = await context.prisma.emailAudience.findMany({
      include: audienceInclude,
      orderBy: { updatedAt: 'desc' },
    })
    return audiences.map(mapAudience)
  })

const getAudience = authed
  .route({ path: '/email/audiences/get', method: 'GET' })
  .input(audienceIdInput)
  .handler(async ({ context, input }) =>
    mapAudience(await getAudienceOrThrow(context.prisma, input.audienceId)),
  )

const createAudience = authed
  .route({ path: '/email/audiences/create', method: 'POST' })
  .input(audienceFieldsInput)
  .handler(async ({ context, input }) => {
    const audience = await context.prisma.emailAudience.create({
      data: {
        id: generateUUID(),
        ...validateAudienceFields(input),
        createdById: context.user.id,
      },
      include: audienceInclude,
    })
    return mapAudience(audience)
  })

const updateAudience = authed
  .route({ path: '/email/audiences/update', method: 'POST' })
  .input(audienceIdInput.extend(audienceFieldsInput.shape))
  .handler(async ({ context, input }) => {
    await getAudienceOrThrow(context.prisma, input.audienceId)
    const audience = await context.prisma.emailAudience.update({
      where: { id: input.audienceId },
      data: validateAudienceFields(input),
      include: audienceInclude,
    })
    return mapAudience(audience)
  })

const deleteAudience = authed
  .route({ path: '/email/audiences/delete', method: 'POST' })
  .input(audienceIdInput)
  .handler(async ({ context, input }) => {
    const audience = await getAudienceOrThrow(context.prisma, input.audienceId)
    if (audience.drafts.length > 0) {
      throw new ORPCError('BAD_REQUEST', {
        message:
          'Detach this audience from its active drafts before deleting it',
      })
    }
    await context.prisma.emailAudience.delete({
      where: { id: input.audienceId },
    })
    return { id: input.audienceId }
  })

/** Evaluate an Audience (saved or unsaved) now. Recipients stay internal. */
const previewAudience = authed
  .route({ path: '/email/audiences/preview', method: 'POST' })
  .input(audienceFieldsInput)
  .handler(async ({ context, input }) => {
    const fields = validateAudienceFields(input)
    const resolved = await resolveAudienceFromDb(context.prisma, {
      id: 'preview',
      ...fields,
    })
    return {
      total: resolved.recipients.length,
      fromUsers: resolved.fromUsers,
      fromWaitlist: resolved.fromWaitlist,
      fromIncludePins: resolved.fromIncludePins,
      excludedByPins: resolved.excludedByPins,
      sample: resolved.recipients.slice(0, 10),
    }
  })

/**
 * Every member an Audience (saved or unsaved) resolves to right now, with the
 * Console user's name where one exists. Internal to the Adminboard.
 */
const previewAudienceMembers = authed
  .route({ path: '/email/audiences/preview-members', method: 'POST' })
  .input(audienceFieldsInput)
  .handler(async ({ context, input }) => {
    const fields = validateAudienceFields(input)
    const resolved = await resolveAudienceFromDb(context.prisma, {
      id: 'preview',
      ...fields,
    })
    const users = await context.prisma.user.findMany({
      where: { email: { in: resolved.recipients, mode: 'insensitive' } },
      select: { email: true, name: true },
    })
    const namesByEmail = new Map(
      users.map((user) => [user.email.toLowerCase(), user.name]),
    )
    return {
      total: resolved.recipients.length,
      members: resolved.recipients.map((email) => ({
        email,
        name: namesByEmail.get(email.toLowerCase()) ?? null,
      })),
    }
  })

export const emailAudience = {
  list: listAudiences,
  get: getAudience,
  create: createAudience,
  update: updateAudience,
  delete: deleteAudience,
  preview: previewAudience,
  previewMembers: previewAudienceMembers,
}

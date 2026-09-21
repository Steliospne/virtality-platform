import { ORPCError } from '@orpc/server'
import type { PrismaClient } from '@virtality/db'
import { emailOptOutScopeSchema } from '@virtality/shared/types'
import {
  emailOptOutScopeToTopic,
  emailOptOutTopicToScope,
  generateUUID,
  isEmailOptOutCovered,
  listAdminEmailTopics,
  normalizeEmailAddress,
} from '@virtality/shared/utils'
import { z } from 'zod'
import { base } from '../context.ts'
import { authed } from '../middleware/auth.ts'
import {
  getEmailOptOutSecret,
  verifyEmailOptOutToken,
} from './admin-authored-email/opt-out-token.ts'

type OptOutRow = {
  id: string
  email: string
  topic: 'product_updates' | 'newsletter' | 'promotions' | null
  source: 'recipient_link' | 'admin'
  note: string | null
  recordedById: string | null
  createdAt: Date
}

const mapOptOut = (row: OptOutRow) => ({
  id: row.id,
  email: row.email,
  scope: emailOptOutTopicToScope(row.topic),
  source: row.source,
  note: row.note,
  recordedById: row.recordedById,
  createdAt: row.createdAt,
})

/**
 * Record an Opt-out unless one already covers the scope. Never reverses an
 * existing one. Returns the row that covers the request.
 */
const recordOptOut = async (
  prisma: PrismaClient,
  input: {
    email: string
    scope: z.infer<typeof emailOptOutScopeSchema>
    source: 'recipient_link' | 'admin'
    note?: string | null
    recordedById?: string | null
  },
) => {
  const email = normalizeEmailAddress(input.email)
  const topic = emailOptOutScopeToTopic(input.scope)
  const existing = await prisma.emailOptOut.findMany({ where: { email } })

  if (isEmailOptOutCovered(existing, { email, topic })) {
    return { created: false as const, optOut: null }
  }

  const optOut = await prisma.emailOptOut.create({
    data: {
      id: generateUUID(),
      email,
      topic,
      source: input.source,
      note: input.note?.trim() || null,
      recordedById: input.recordedById ?? null,
    },
  })

  return { created: true as const, optOut: mapOptOut(optOut) }
}

const listOptOuts = authed
  .route({ path: '/email/opt-outs/list', method: 'GET' })
  .handler(async ({ context }) => {
    const rows = await context.prisma.emailOptOut.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(mapOptOut)
  })

const recordOptOutByAdmin = authed
  .route({ path: '/email/opt-outs/record', method: 'POST' })
  .input(
    z.object({
      email: z.string().email(),
      scope: emailOptOutScopeSchema,
      note: z.string().max(500).nullable().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const result = await recordOptOut(context.prisma, {
      ...input,
      source: 'admin',
      recordedById: context.user.id,
    })

    if (!result.created) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'An opt-out already covers this email and scope',
      })
    }

    return result.optOut
  })

const listTopics = base
  .route({ path: '/email/topics/list', method: 'GET' })
  .handler(async () => listAdminEmailTopics())

const tokenInput = z.object({ token: z.string().min(1) })

const verifyOrThrow = (token: string) => {
  const payload = verifyEmailOptOutToken(token, getEmailOptOutSecret())
  if (!payload) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'This opt-out link is invalid',
    })
  }
  return payload
}

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`
}

/** Public: what the footer link points at, before the recipient confirms. */
const inspectOptOutLink = base
  .route({ path: '/email/opt-out/inspect', method: 'GET' })
  .input(tokenInput)
  .handler(async ({ context, input }) => {
    const payload = verifyOrThrow(input.token)
    const existing = await context.prisma.emailOptOut.findMany({
      where: { email: payload.email },
      select: { email: true, topic: true },
    })

    return {
      maskedEmail: maskEmail(payload.email),
      scope: payload.scope,
      alreadyOptedOut: isEmailOptOutCovered(existing, {
        email: payload.email,
        topic: emailOptOutScopeToTopic(payload.scope),
      }),
      topics: listAdminEmailTopics(),
    }
  })

/** Public: the recipient confirms the opt-out carried by the link. */
const confirmOptOutLink = base
  .route({ path: '/email/opt-out/confirm', method: 'POST' })
  .input(
    tokenInput.extend({
      /** Recipients may widen a Topic link to all Topics on the page. */
      scope: emailOptOutScopeSchema.optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const payload = verifyOrThrow(input.token)
    const scope = input.scope === 'all' ? 'all' : payload.scope

    const result = await recordOptOut(context.prisma, {
      email: payload.email,
      scope,
      source: 'recipient_link',
    })

    return {
      maskedEmail: maskEmail(payload.email),
      scope,
      created: result.created,
    }
  })

export const emailOptOut = {
  list: listOptOuts,
  record: recordOptOutByAdmin,
  topics: listTopics,
  inspect: inspectOptOutLink,
  confirm: confirmOptOutLink,
}

import type { PrismaClient } from '@virtality/db'
import type { AdminEmailTopic } from '@virtality/shared/types'
import {
  parseEmailAudienceRuleJson,
  resolveDraftRecipients,
  resolveEmailAudience,
  type EmailOptOutRecord,
  type ResolvedDraftRecipients,
  type ResolvedEmailAudience,
} from '@virtality/shared/utils'

export type AudienceRow = {
  id: string
  name: string
  ruleJson: string
  includeEmails: string[]
  excludeEmails: string[]
}

/** Load the Audience's dynamic sources and resolve it. Rule evaluated now. */
export const resolveAudienceFromDb = async (
  prisma: PrismaClient,
  audience: AudienceRow,
): Promise<ResolvedEmailAudience> => {
  const rule = parseEmailAudienceRuleJson(audience.ruleJson)

  const [users, waitlist] = await Promise.all([
    rule.includeUsers
      ? prisma.user.findMany({
          where: { deletedAt: null, banned: { not: true } },
          select: { email: true, role: true },
        })
      : Promise.resolve([]),
    rule.includeWaitlist
      ? prisma.waitingList.findMany({
          where: { deletedAt: null },
          select: { email: true },
        })
      : Promise.resolve([]),
  ])

  return resolveEmailAudience(
    {
      rule,
      includeEmails: audience.includeEmails,
      excludeEmails: audience.excludeEmails,
    },
    {
      users,
      waitlist: waitlist.map((row) => row.email),
    },
  )
}

export const loadOptOutsForTopic = async (
  prisma: PrismaClient,
  topic: AdminEmailTopic,
): Promise<EmailOptOutRecord[]> =>
  prisma.emailOptOut.findMany({
    where: { OR: [{ topic: null }, { topic }] },
    select: { email: true, topic: true },
  })

export type DraftTargeting = {
  recipients: string[]
  topic: AdminEmailTopic
  audience: AudienceRow | null
}

/** Explicit list ∪ Audience, minus Opt-outs for the draft's Topic. */
export const resolveDraftRecipientsFromDb = async (
  prisma: PrismaClient,
  draft: DraftTargeting,
): Promise<ResolvedDraftRecipients & { audienceName: string | null }> => {
  const [audience, optOuts] = await Promise.all([
    draft.audience
      ? resolveAudienceFromDb(prisma, draft.audience)
      : Promise.resolve(null),
    loadOptOutsForTopic(prisma, draft.topic),
  ])

  return {
    ...resolveDraftRecipients({
      explicitRecipients: draft.recipients,
      audienceRecipients: audience?.recipients ?? [],
      optOuts,
      topic: draft.topic,
    }),
    audienceName: draft.audience?.name ?? null,
  }
}

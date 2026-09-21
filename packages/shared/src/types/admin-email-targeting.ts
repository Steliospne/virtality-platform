import { z } from 'zod'

/**
 * Topic: a fixed, code-defined category of Admin-authored Email that a
 * recipient can opt out of. Values mirror the `AdminEmailTopic` Prisma enum.
 */
export const ADMIN_EMAIL_TOPICS = [
  'product_updates',
  'newsletter',
  'promotions',
] as const

export const adminEmailTopicSchema = z.enum(ADMIN_EMAIL_TOPICS)

export type AdminEmailTopic = z.infer<typeof adminEmailTopicSchema>

export const DEFAULT_ADMIN_EMAIL_TOPIC: AdminEmailTopic = 'product_updates'

/** Opt-out scope: one Topic, or `all` Topics. */
export const emailOptOutScopeSchema = z.union([
  adminEmailTopicSchema,
  z.literal('all'),
])

export type EmailOptOutScope = z.infer<typeof emailOptOutScopeSchema>

export const EMAIL_AUDIENCE_USER_ROLES = ['user', 'admin', 'tester'] as const

export type EmailAudienceUserRole = (typeof EMAIL_AUDIENCE_USER_ROLES)[number]

/**
 * Audience rule: the dynamic part of an Audience, evaluated at send time.
 * Static include / exclude pins live next to it on the Audience row.
 */
export const emailAudienceRuleSchema = z.object({
  includeUsers: z.boolean().default(false),
  /** Empty means every role. */
  userRoles: z.array(z.enum(EMAIL_AUDIENCE_USER_ROLES)).default([]),
  includeWaitlist: z.boolean().default(false),
})

export type EmailAudienceRule = z.infer<typeof emailAudienceRuleSchema>

export const EMPTY_EMAIL_AUDIENCE_RULE: EmailAudienceRule = {
  includeUsers: false,
  userRoles: [],
  includeWaitlist: false,
}

export const MAX_EMAIL_AUDIENCE_PINS = 200

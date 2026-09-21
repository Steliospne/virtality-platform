import {
  ADMIN_EMAIL_TOPICS,
  type AdminEmailTopic,
  type EmailOptOutScope,
} from '../../types/admin-email-targeting.ts'

export type AdminEmailTopicInfo = {
  id: AdminEmailTopic
  label: string
  /** Recipient-facing one-liner used on the opt-out page and footer. */
  description: string
}

const TOPIC_INFO: Record<AdminEmailTopic, Omit<AdminEmailTopicInfo, 'id'>> = {
  product_updates: {
    label: 'Product updates',
    description: 'New features, improvements and release notes.',
  },
  newsletter: {
    label: 'Newsletter',
    description: 'Stories, tips and news from the Virtality team.',
  },
  promotions: {
    label: 'Promotions',
    description: 'Offers, discounts and limited-time campaigns.',
  },
}

export const listAdminEmailTopics = (): AdminEmailTopicInfo[] =>
  ADMIN_EMAIL_TOPICS.map((id) => ({ id, ...TOPIC_INFO[id] }))

export const getAdminEmailTopicLabel = (topic: AdminEmailTopic): string =>
  TOPIC_INFO[topic].label

export const getAdminEmailTopicDescription = (topic: AdminEmailTopic): string =>
  TOPIC_INFO[topic].description

export const getEmailOptOutScopeLabel = (scope: EmailOptOutScope): string =>
  scope === 'all' ? 'All admin emails' : getAdminEmailTopicLabel(scope)

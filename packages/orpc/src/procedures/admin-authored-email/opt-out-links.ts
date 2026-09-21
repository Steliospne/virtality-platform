import { getWebsiteUrl } from '@virtality/shared/types'
import type { AdminEmailTopic } from '@virtality/shared/types'
import { getAdminEmailTopicLabel } from '@virtality/shared/utils'
import type { AdminEmailOptOutLinks } from '@virtality/ui/render-admin-authored-email'
import {
  buildEmailOptOutUrl,
  getEmailOptOutSecret,
  signEmailOptOutToken,
} from './opt-out-token.ts'

/**
 * The email is rendered once with these placeholders and the per-recipient
 * signed links are swapped in at delivery. The placeholders are plain
 * alphanumerics so they survive HTML escaping untouched.
 */
const TOPIC_PLACEHOLDER = 'OPTOUTTOPICTOKENPLACEHOLDER'
const ALL_PLACEHOLDER = 'OPTOUTALLTOKENPLACEHOLDER'

export const buildOptOutPlaceholderLinks = (
  topic: AdminEmailTopic,
): AdminEmailOptOutLinks => {
  const websiteBase = getWebsiteUrl()
  return {
    topicLabel: getAdminEmailTopicLabel(topic),
    topicUrl: buildEmailOptOutUrl(websiteBase, TOPIC_PLACEHOLDER),
    allUrl: buildEmailOptOutUrl(websiteBase, ALL_PLACEHOLDER),
  }
}

/** Returns a per-recipient HTML renderer for `deliverIndividualEmails`. */
export const personaliseOptOutLinks = (
  html: string,
  topic: AdminEmailTopic,
  secret: string = getEmailOptOutSecret(),
) => {
  return (recipient: string): string =>
    html
      .replaceAll(
        TOPIC_PLACEHOLDER,
        encodeURIComponent(
          signEmailOptOutToken({ email: recipient, scope: topic }, secret),
        ),
      )
      .replaceAll(
        ALL_PLACEHOLDER,
        encodeURIComponent(
          signEmailOptOutToken({ email: recipient, scope: 'all' }, secret),
        ),
      )
}

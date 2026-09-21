import { Link, Text } from 'react-email'
import { footerText } from '../styles/email.js'

export interface AdminEmailOptOutLinks {
  /** Recipient-facing Topic label, e.g. "Product updates". */
  topicLabel: string
  /** Opt out of this Topic only. */
  topicUrl: string
  /** Opt out of every Admin-authored Email Topic. */
  allUrl: string
}

const optOutLink = {
  color: '#6B7280',
  textDecoration: 'underline',
} as const

/**
 * Opt-out line rendered only inside Admin-authored Email. System Emails never
 * carry it.
 */
export const AdminEmailOptOutFooter = ({
  topicLabel,
  topicUrl,
  allUrl,
}: AdminEmailOptOutLinks) => (
  <Text style={footerText}>
    You are receiving this because you are on the Virtality {topicLabel} list.{' '}
    <Link href={topicUrl} style={optOutLink}>
      Stop {topicLabel} emails
    </Link>
    {' · '}
    <Link href={allUrl} style={optOutLink}>
      Stop all admin emails
    </Link>
  </Text>
)

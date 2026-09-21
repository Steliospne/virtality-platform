'use client'

import { Badge } from '@virtality/ui/components/badge'
import {
  EMAIL_LIST_STATUS_LABELS,
  type EmailListStatus,
} from '@/lib/email-list-items'

const VARIANTS: Record<EmailListStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  'send-ready': 'default',
  'final-sent': 'outline',
  archived: 'outline',
  sent: 'secondary',
}

export const EmailStatusBadge = ({ status }: { status: EmailListStatus }) => (
  <Badge variant={VARIANTS[status]}>{EMAIL_LIST_STATUS_LABELS[status]}</Badge>
)

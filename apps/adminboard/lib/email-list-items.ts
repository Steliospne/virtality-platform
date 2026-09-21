import type { AdminEmailTopic } from '@virtality/shared/types'

export type EmailListStatus =
  | 'draft'
  | 'send-ready'
  | 'final-sent'
  | 'archived'
  | 'sent'

export type EmailListFilter = 'all' | 'drafts' | 'sent' | 'archived'

export type EmailListItem = {
  kind: 'draft' | 'sent'
  id: string
  subject: string
  status: EmailListStatus
  topic: AdminEmailTopic
  audienceName: string | null
  recipientCount: number
  failedCount: number
  /** Last edit for drafts, send time for sent records. */
  at: string | Date
}

type DraftLike = {
  id: string
  subject: string
  topic: AdminEmailTopic
  audienceName: string | null
  recipients: string[]
  isFinalSent: boolean
  sendReadiness: { ready: boolean }
  updatedAt: string | Date
}

type SentLike = {
  id: string
  subject: string
  topic: AdminEmailTopic
  audienceName: string | null
  recipients: string[]
  deliveryResults: { status: string }[]
  sentAt: string | Date
}

export const EMAIL_LIST_STATUS_LABELS: Record<EmailListStatus, string> = {
  draft: 'Draft',
  'send-ready': 'Send-ready',
  'final-sent': 'Final sent',
  archived: 'Archived',
  sent: 'Sent',
}

const draftStatus = (draft: DraftLike, archived: boolean): EmailListStatus => {
  if (archived) return 'archived'
  if (draft.isFinalSent) return 'final-sent'
  return draft.sendReadiness.ready ? 'send-ready' : 'draft'
}

export const toDraftListItem = (
  draft: DraftLike,
  archived = false,
): EmailListItem => ({
  kind: 'draft',
  id: draft.id,
  subject: draft.subject,
  status: draftStatus(draft, archived),
  topic: draft.topic,
  audienceName: draft.audienceName,
  recipientCount: draft.recipients.length,
  failedCount: 0,
  at: draft.updatedAt,
})

export const toSentListItem = (sentRecord: SentLike): EmailListItem => ({
  kind: 'sent',
  id: sentRecord.id,
  subject: sentRecord.subject,
  status: 'sent',
  topic: sentRecord.topic,
  audienceName: sentRecord.audienceName,
  recipientCount: sentRecord.recipients.length,
  failedCount: sentRecord.deliveryResults.filter(
    (result) => result.status === 'failed',
  ).length,
  at: sentRecord.sentAt,
})

/** Drafts, then archived drafts, then sent records — each group as listed. */
export const buildEmailListItems = ({
  drafts,
  archivedDrafts,
  sentRecords,
}: {
  drafts: DraftLike[]
  archivedDrafts: DraftLike[]
  sentRecords: SentLike[]
}): EmailListItem[] => [
  ...drafts.map((draft) => toDraftListItem(draft)),
  ...archivedDrafts.map((draft) => toDraftListItem(draft, true)),
  ...sentRecords.map(toSentListItem),
]

export const matchesEmailListFilter = (
  item: EmailListItem,
  filter: EmailListFilter,
): boolean => {
  switch (filter) {
    case 'all':
      return true
    case 'drafts':
      return item.kind === 'draft' && item.status !== 'archived'
    case 'sent':
      return item.kind === 'sent'
    case 'archived':
      return item.status === 'archived'
  }
}

export const filterEmailListItems = (
  items: EmailListItem[],
  filter: EmailListFilter,
  query: string,
): EmailListItem[] => {
  const needle = query.trim().toLowerCase()
  return items.filter(
    (item) =>
      matchesEmailListFilter(item, filter) &&
      (needle === '' ||
        (item.subject.trim() || 'untitled').toLowerCase().includes(needle) ||
        (item.audienceName ?? '').toLowerCase().includes(needle)),
  )
}

export const getEmailListSubject = (item: EmailListItem): string =>
  item.subject.trim() ||
  (item.kind === 'draft' ? 'Untitled draft' : 'Untitled email')

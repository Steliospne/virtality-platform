import { describe, expect, it } from 'vitest'
import {
  buildEmailListItems,
  filterEmailListItems,
  getEmailListSubject,
  toDraftListItem,
  toSentListItem,
} from './email-list-items'

const draft = {
  id: 'd1',
  subject: 'September update',
  topic: 'product_updates' as const,
  audienceName: 'All clinicians',
  recipients: ['a@x.com'],
  isFinalSent: false,
  sendReadiness: { ready: true },
  updatedAt: '2026-09-20T10:00:00Z',
}

const sent = {
  id: 's1',
  subject: 'August newsletter',
  topic: 'newsletter' as const,
  audienceName: null,
  recipients: ['a@x.com', 'b@x.com'],
  deliveryResults: [{ status: 'sent' }, { status: 'failed' }],
  sentAt: '2026-08-30T10:00:00Z',
}

describe('email list items', () => {
  it('derives draft status from archive, final-send and readiness', () => {
    expect(toDraftListItem(draft).status).toBe('send-ready')
    expect(toDraftListItem(draft, true).status).toBe('archived')
    expect(toDraftListItem({ ...draft, isFinalSent: true }).status).toBe(
      'final-sent',
    )
    expect(
      toDraftListItem({ ...draft, sendReadiness: { ready: false } }).status,
    ).toBe('draft')
  })

  it('counts failed deliveries on sent records', () => {
    expect(toSentListItem(sent)).toMatchObject({
      status: 'sent',
      recipientCount: 2,
      failedCount: 1,
    })
  })

  it('filters by kind and matches subject or audience text', () => {
    const items = buildEmailListItems({
      drafts: [draft],
      archivedDrafts: [{ ...draft, id: 'd2', subject: '' }],
      sentRecords: [sent],
    })

    expect(filterEmailListItems(items, 'all', '').map((i) => i.id)).toEqual([
      'd1',
      'd2',
      's1',
    ])
    expect(filterEmailListItems(items, 'drafts', '').map((i) => i.id)).toEqual([
      'd1',
    ])
    expect(
      filterEmailListItems(items, 'archived', '').map((i) => i.id),
    ).toEqual(['d2'])
    expect(
      filterEmailListItems(items, 'all', 'clinic').map((i) => i.id),
    ).toEqual(['d1', 'd2'])
    expect(filterEmailListItems(items, 'all', 'untitled')[0]?.id).toBe('d2')
  })

  it('labels empty subjects by kind', () => {
    expect(
      getEmailListSubject(toDraftListItem({ ...draft, subject: ' ' })),
    ).toBe('Untitled draft')
    expect(getEmailListSubject(toSentListItem({ ...sent, subject: '' }))).toBe(
      'Untitled email',
    )
  })
})

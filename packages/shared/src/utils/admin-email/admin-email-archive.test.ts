import { describe, expect, it } from 'vitest'
import {
  buildArchiveDraftData,
  buildRestoreDraftData,
  isDraftArchived,
  partitionDraftsByArchiveStatus,
} from './admin-email-archive.ts'

describe('isDraftArchived', () => {
  it('treats drafts with archivedAt as archived', () => {
    expect(
      isDraftArchived({ archivedAt: new Date('2026-06-01T12:00:00Z') }),
    ).toBe(true)
    expect(isDraftArchived({ archivedAt: null })).toBe(false)
  })
})

describe('partitionDraftsByArchiveStatus', () => {
  it('splits active and archived drafts', () => {
    const active = { id: 'active', archivedAt: null }
    const archived = {
      id: 'archived',
      archivedAt: new Date('2026-06-01T12:00:00Z'),
    }

    expect(partitionDraftsByArchiveStatus([active, archived])).toEqual({
      active: [active],
      archived: [archived],
    })
  })
})

describe('buildArchiveDraftData', () => {
  it('records archive metadata and clears restore metadata', () => {
    const archivedAt = new Date('2026-06-12T10:00:00Z')

    expect(buildArchiveDraftData('user-1', archivedAt)).toEqual({
      archivedAt,
      archivedById: 'user-1',
      restoredAt: null,
      restoredById: null,
    })
  })
})

describe('buildRestoreDraftData', () => {
  it('clears archive metadata and records restore metadata with a fresh updatedAt', () => {
    const restoredAt = new Date('2026-06-12T11:00:00Z')

    expect(buildRestoreDraftData('user-2', restoredAt)).toEqual({
      archivedAt: null,
      archivedById: null,
      restoredAt,
      restoredById: 'user-2',
      updatedAt: restoredAt,
    })
  })
})

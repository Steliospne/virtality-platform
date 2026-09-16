import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImmersiveVideoAdminRow } from '@/lib/immersive-video-admin-row'
import { immersiveVideoRowActions } from '@/lib/immersive-video-admin-row'

const rows: ImmersiveVideoAdminRow[] = [
  fixture({ id: 'draft-empty', title: 'Empty draft', state: 'Draft' }),
  fixture({
    id: 'uploading',
    title: 'Uploading clip',
    state: 'Uploading',
    uploadProgress: { uploadedParts: 1, partCount: 3 },
  }),
  fixture({ id: 'verifying', title: 'Verifying clip', state: 'Verifying' }),
  fixture({
    id: 'draft-file',
    title: 'Draft with file',
    state: 'Draft',
    filename: 'trail.mp4',
    sizeBytes: 1000,
  }),
  fixture({
    id: 'published',
    title: 'Published clip',
    state: 'Published',
    filename: 'trail.mp4',
    sizeBytes: 1000,
  }),
  fixture({
    id: 'republishing',
    title: 'Republishing clip',
    state: 'Republishing',
    filename: 'trail.mp4',
    sizeBytes: 1000,
  }),
  fixture({
    id: 'unpublished',
    title: 'Unpublished clip',
    state: 'Unpublished',
    filename: 'trail.mp4',
    sizeBytes: 1000,
  }),
]

function fixture(
  overrides: Partial<ImmersiveVideoAdminRow> &
    Pick<ImmersiveVideoAdminRow, 'id' | 'title' | 'state'>,
): ImmersiveVideoAdminRow {
  return {
    activity: 'CYCLING',
    description: null,
    sizeBytes: null,
    durationSec: null,
    thumbnailUrl: null,
    filename: null,
    verifyFailedAt: null,
    publishedAt: null,
    createdAt: new Date('2026-09-12T12:00:00.000Z'),
    updatedAt: new Date('2026-09-12T12:00:00.000Z'),
    ...overrides,
  }
}

vi.mock('@virtality/react-query', () => ({
  useImmersiveVideoCatalog: () => ({
    data: rows,
    isPending: false,
    refetch: vi.fn(),
  }),
  useCreateImmersiveVideo: () => ({ mutate: vi.fn() }),
  useDiscardImmersiveVideoIfEmpty: () => ({ mutate: vi.fn() }),
  usePublishImmersiveVideo: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishImmersiveVideo: () => ({ mutate: vi.fn() }),
  useDeleteImmersiveVideo: () => ({ mutate: vi.fn() }),
  useUpdateImmersiveVideo: () => ({ mutate: vi.fn() }),
  useSetImmersiveVideoThumbnail: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  }),
  useORPC: () => ({
    immersiveVideo: {
      upload: {
        start: { call: vi.fn() },
        part: { call: vi.fn() },
        status: { call: vi.fn() },
        complete: { call: vi.fn() },
        abort: { call: vi.fn() },
      },
    },
  }),
}))

import ImmersiveVideoTable from './immersive-video-table'

describe('ImmersiveVideoTable', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the seven catalog state badges', () => {
    render(<ImmersiveVideoTable />)

    const badges = screen.getAllByTestId('immersive-video-state-badge')
    expect(badges.map((badge) => badge.textContent)).toEqual([
      'Draft · no file',
      'Uploading',
      'Verifying',
      'Draft',
      'Published',
      'Republishing',
      'Unpublished',
    ])
  })

  it('offers row actions for each catalog state', () => {
    render(<ImmersiveVideoTable />)

    const lists = screen.getAllByTestId('immersive-video-row-actions')
    expect(lists.map((list) => list.textContent)).toEqual(
      rows.map((row) => immersiveVideoRowActions(row).join(', ')),
    )
  })
})

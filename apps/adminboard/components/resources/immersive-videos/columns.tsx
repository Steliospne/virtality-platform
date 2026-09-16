'use client'

import { ImmersiveVideoRowActions } from '@/components/resources/immersive-videos/immersive-video-row-actions'
import type { ImmersiveVideoRowActionHandlers } from '@/components/resources/immersive-videos/immersive-video-row-actions'
import { ImmersiveVideoStateBadge } from '@/components/resources/immersive-videos/immersive-video-state-badge'
import { ImmersiveVideoUploadProgress } from '@/components/resources/immersive-videos/immersive-video-upload-progress'
import DateCell from '@/components/tables/date-cell'
import { ColumnHeader } from '@/components/tables/header-cell'
import type { ImmersiveVideoAdminRow } from '@/lib/immersive-video-admin-row'
import {
  formatImmersiveVideoDuration,
  formatImmersiveVideoSize,
  liveImmersiveVideoUploadProgress,
  storedImmersiveVideoUploadProgress,
} from '@/lib/immersive-video-admin-row'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

export function createImmersiveVideoColumns(
  handlers: ImmersiveVideoRowActionHandlers,
  options: {
    /** The Progress column only earns its space while a row is Uploading. */
    showProgress: boolean
  },
): ColumnDef<ImmersiveVideoAdminRow>[] {
  const progressColumn: ColumnDef<ImmersiveVideoAdminRow> = {
    id: 'progress',
    header: 'Progress',
    enableSorting: false,
    cell: ({ row }) => {
      if (row.original.state !== 'Uploading') return null
      const progress =
        handlers.upload.activeVideoId === row.original.id
          ? liveImmersiveVideoUploadProgress(
              handlers.upload.uploadedBytes,
              handlers.upload.totalBytes,
            )
          : storedImmersiveVideoUploadProgress(row.original)
      return progress ? (
        <div className='min-w-40'>
          <ImmersiveVideoUploadProgress {...progress} />
        </div>
      ) : null
    },
  }

  return [
    {
      accessorKey: 'thumbnailUrl',
      header: 'Thumbnail',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.thumbnailUrl}
            alt=''
            className={cn('size-12 rounded object-cover')}
          />
        ) : (
          <div className={cn('bg-muted size-12 rounded')} />
        ),
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <ColumnHeader column={column} title='Title' />,
      cell: ({ row }) => row.original.title.trim() || 'Untitled',
    },
    {
      accessorKey: 'activity',
      header: ({ column }) => <ColumnHeader column={column} title='Activity' />,
      cell: ({ row }) =>
        row.original.activity === 'WALKING' ? 'Walking' : 'Cycling',
    },
    {
      accessorKey: 'state',
      header: ({ column }) => <ColumnHeader column={column} title='State' />,
      filterFn: (row, _id, value: string[]) => {
        if (!value?.length) return true
        return value.includes(row.original.state)
      },
      cell: ({ row }) => (
        <div className='space-y-1'>
          <ImmersiveVideoStateBadge row={row.original} />
          {row.original.verifyFailedAt ? (
            <p className='text-destructive text-xs'>
              The uploaded file failed verification. Upload it again.
            </p>
          ) : null}
        </div>
      ),
    },
    ...(options.showProgress ? [progressColumn] : []),
    {
      accessorKey: 'sizeBytes',
      header: ({ column }) => <ColumnHeader column={column} title='Size' />,
      cell: ({ row }) => formatImmersiveVideoSize(row.original.sizeBytes),
    },
    {
      accessorKey: 'durationSec',
      header: ({ column }) => <ColumnHeader column={column} title='Duration' />,
      cell: ({ row }) => formatImmersiveVideoDuration(row.original.durationSec),
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <ColumnHeader column={column} title='Updated' />,
      cell: ({ row, column }) => <DateCell row={row} id={column.id} />,
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => (
        <ImmersiveVideoRowActions row={row.original} handlers={handlers} />
      ),
    },
  ]
}

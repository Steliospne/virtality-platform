'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@virtality/ui/components/button'
import { Badge } from '@virtality/ui/components/badge'
import {
  formatByteSize,
  formatReportedAgo,
  pausedProgressLabel,
  stalledSuffix,
} from '@/lib/headset-library-format'
import type { HeadsetLibraryCell } from '@/lib/headset-library-rows'
import { DeleteFromHeadsetButton } from './delete-from-headset-button'
import { DownloadPrepDialog } from './download-prep-dialog'
import { FailedLibraryCell } from './failed-library-cell'
import { LibraryCellCancelButton } from './library-cell-cancel-button'
import { LibraryCellDownloading } from './library-cell-downloading'
import { LibraryCellPaused } from './library-cell-paused'
import {
  StorageWarningDialog,
  needsStorageWarning,
  storageWarningCopy,
} from './storage-warning-dialog'

export function LibraryCell({
  cell,
  roomComplete,
  frozen,
  sizeBytes,
  freeBytes,
  onDownload,
  onPause,
  onCancel,
  onDelete,
}: {
  cell: HeadsetLibraryCell
  roomComplete: boolean
  frozen: boolean
  sizeBytes: number
  freeBytes: number | null
  onDownload: () => void
  onPause: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [prepOpen, setPrepOpen] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const disabled = !roomComplete || frozen

  const requestDownload = () => {
    if (disabled) return
    setPrepOpen(true)
  }

  const confirmPrep = () => {
    setPrepOpen(false)
    if (needsStorageWarning(sizeBytes, freeBytes)) {
      setWarningOpen(true)
      return
    }
    onDownload()
  }

  let content: ReactNode = null
  switch (cell.type) {
    case 'on-headset':
      content = (
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>On headset</Badge>
          <DeleteFromHeadsetButton disabled={disabled} onDelete={onDelete} />
        </div>
      )
      break
    case 'downloading':
      content = (
        <LibraryCellDownloading
          percent={cell.percent}
          stalled={cell.stalled}
          disabled={disabled}
          onPause={onPause}
          onCancel={onCancel}
        />
      )
      break
    case 'paused':
      content = (
        <LibraryCellPaused
          bytesDownloaded={cell.bytesDownloaded}
          sizeBytes={cell.sizeBytes}
          disabled={disabled}
          onResume={requestDownload}
          onCancel={onCancel}
        />
      )
      break
    case 'failed':
      content = (
        <FailedLibraryCell
          reason={cell.reason}
          disabled={disabled}
          onDownload={requestDownload}
        />
      )
      break
    case 'absent':
      content = (
        <Button
          type='button'
          size='sm'
          disabled={disabled}
          onClick={requestDownload}
        >
          Download ({formatByteSize(sizeBytes)})
        </Button>
      )
      break
    case 'requested':
      content = (
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>Requested</Badge>
          <LibraryCellCancelButton disabled={disabled} onCancel={onCancel} />
        </div>
      )
      break
    case 'offline-requested':
      content = (
        <div className='text-right'>
          <Badge variant='secondary'>Requested</Badge>
          <p className='text-muted-foreground mt-1 text-xs'>
            Waiting for the headset
          </p>
        </div>
      )
      break
    case 'offline-on-headset': {
      const reportedAgo = formatReportedAgo(cell.reportedAt)
      content = (
        <Badge variant='secondary'>
          On headset{reportedAgo ? ` · ${reportedAgo}` : ''}
        </Badge>
      )
      break
    }
    case 'offline-absent':
      content = <Badge variant='outline'>Not on headset</Badge>
      break
    case 'not-in-catalog':
      content = (
        <div className='flex items-center gap-2'>
          <Badge variant='outline'>Not in catalog</Badge>
          <DeleteFromHeadsetButton disabled={disabled} onDelete={onDelete} />
        </div>
      )
      break
    case 'offline-downloading':
      content = (
        <Badge variant='secondary'>
          Downloading {cell.percent}%{stalledSuffix(cell.stalled)}
        </Badge>
      )
      break
    case 'offline-paused':
      content = (
        <Badge variant='secondary'>
          {pausedProgressLabel(cell.bytesDownloaded, cell.sizeBytes)}
        </Badge>
      )
      break
    case 'offline-failed':
      content = <FailedLibraryCell reason={cell.reason} disabled />
      break
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      {content}
      <DownloadPrepDialog
        open={prepOpen}
        onCancel={() => setPrepOpen(false)}
        onConfirm={confirmPrep}
      />
      <StorageWarningDialog
        open={warningOpen}
        description={storageWarningCopy(
          formatByteSize(freeBytes ?? 0),
          formatByteSize(sizeBytes),
        )}
        onCancel={() => setWarningOpen(false)}
        onConfirm={() => {
          setWarningOpen(false)
          onDownload()
        }}
      />
    </div>
  )
}

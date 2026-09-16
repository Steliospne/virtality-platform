'use client'

import { ImmersiveVideoDeleteDialog } from '@/components/resources/immersive-videos/immersive-video-delete-dialog'
import { ImmersiveVideoReplaceFileDialog } from '@/components/resources/immersive-videos/immersive-video-replace-file-dialog'
import { ImmersiveVideoUnpublishDialog } from '@/components/resources/immersive-videos/immersive-video-unpublish-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import type { ImmersiveVideoAdminRow } from '@/lib/immersive-video-admin-row'
import { immersiveVideoRowActions } from '@/lib/immersive-video-admin-row'
import type { ImmersiveVideoUploadController } from '@/hooks/use-immersive-video-upload'
import { Ellipsis } from 'lucide-react'
import { useState } from 'react'

export type ImmersiveVideoRowActionHandlers = {
  onEdit: (row: ImmersiveVideoAdminRow) => void
  onUploadFile: (row: ImmersiveVideoAdminRow) => void
  onResumeUpload: (row: ImmersiveVideoAdminRow) => void
  onPublish: (row: ImmersiveVideoAdminRow) => void
  upload: ImmersiveVideoUploadController
}

export function ImmersiveVideoRowActions({
  row,
  handlers,
}: {
  row: ImmersiveVideoAdminRow
  handlers: ImmersiveVideoRowActionHandlers
}) {
  const { open, setOpen, runAfterClose } = useDropdownMenu()
  const [unpublishOpen, setUnpublishOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const actions = immersiveVideoRowActions(row)
  const otherUploadActive =
    handlers.upload.isUploading && handlers.upload.activeVideoId !== row.id

  const run = (label: (typeof actions)[number]) => {
    if (label === 'Edit') {
      handlers.onEdit(row)
      return
    }
    if (label === 'Upload file') {
      handlers.onUploadFile(row)
      return
    }
    if (label === 'Resume upload') {
      handlers.onResumeUpload(row)
      return
    }
    if (label === 'Cancel upload' || label === 'Cancel replace') {
      void handlers.upload.abortUpload(row.id)
      return
    }
    if (label === 'Publish') {
      handlers.onPublish(row)
      return
    }
    if (label === 'Replace file') {
      setReplaceOpen(true)
      return
    }
    if (label === 'Unpublish') {
      setUnpublishOpen(true)
      return
    }
    if (label === 'Delete') {
      setDeleteOpen(true)
    }
  }

  return (
    <>
      <span data-testid='immersive-video-row-actions' className='sr-only'>
        {actions.join(', ')}
      </span>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size='icon'
            variant='ghost'
            className='size-6'
            aria-label='Row actions'
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent id='actions'>
          {actions.map((label) => (
            <DropdownMenuItem
              key={label}
              disabled={
                otherUploadActive &&
                (label === 'Upload file' ||
                  label === 'Resume upload' ||
                  label === 'Replace file')
              }
              onSelect={() => runAfterClose(() => run(label))}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ImmersiveVideoUnpublishDialog
        open={unpublishOpen}
        onOpenChange={setUnpublishOpen}
        videoId={row.id}
        title={row.title}
      />
      <ImmersiveVideoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        videoId={row.id}
        title={row.title}
      />
      <ImmersiveVideoReplaceFileDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        disabled={otherUploadActive}
        disabledReason={handlers.upload.otherRowsDisabledMessage}
        onFile={(picked) =>
          void handlers.upload.startUpload(row.id, picked.file, {
            kind: picked.kind,
          })
        }
      />
    </>
  )
}

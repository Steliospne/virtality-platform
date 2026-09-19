'use client'

import { createImmersiveVideoColumns } from '@/components/resources/immersive-videos/columns'
import { ImmersiveVideoDialog } from '@/components/resources/immersive-videos/immersive-video-dialog'
import type { ImmersiveVideoFileRequest } from '@/components/resources/immersive-videos/immersive-video-file-section'
import FilterBadge from '@/components/ui/filter-badge'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/get-error-message'
import type { ImmersiveVideoAdminRow } from '@/lib/immersive-video-admin-row'
import type { ImmersiveVideoCatalogState } from '@/lib/immersive-video-admin-row'
import { publishPreconditionLabel } from '@/lib/immersive-video-admin-row'
import { immersiveVideoAcceptAll } from '@/lib/immersive-video-file-kind'
import { useImmersiveVideoUpload } from '@/hooks/use-immersive-video-upload'
import {
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
} from '@virtality/ui/components/data-table'
import { useResourceTable } from '@virtality/ui/lib/use-resource-table'
import {
  useCreateImmersiveVideo,
  useDiscardImmersiveVideoIfEmpty,
  useImmersiveVideoCatalog,
  usePublishImmersiveVideo,
} from '@virtality/react-query'
import { PlusSquare } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const STATE_FILTERS: ImmersiveVideoCatalogState[] = [
  'Draft',
  'Uploading',
  'Verifying',
  'Published',
  'Republishing',
  'Unpublished',
]

export default function ImmersiveVideoTable() {
  const catalog = useImmersiveVideoCatalog()
  const createVideo = useCreateImmersiveVideo()
  const discardIfEmpty = useDiscardImmersiveVideoIfEmpty()
  const publish = usePublishImmersiveVideo()
  const upload = useImmersiveVideoUpload({
    onCatalogChange: () => void catalog.refetch(),
  })
  const [dialogRowId, setDialogRowId] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [resumeTargetId, setResumeTargetId] = useState<string | null>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  const data = catalog.data ?? []
  const showProgress = data.some((row) => row.state === 'Uploading')
  const dialogRow = data.find((row) => row.id === dialogRowId) ?? null

  // The first upload may rename the row; the open dialog follows the new id
  // so closing it does not discard-if-empty against an id that is gone.
  const handleFileRequest = async (
    row: ImmersiveVideoAdminRow,
    request: ImmersiveVideoFileRequest,
  ) => {
    setPendingFile(request.file)
    await upload.startUpload(row.id, request.file, {
      kind: request.kind,
      requestedId: request.requestedId,
      onStarted: (id) => {
        if (id !== row.id) {
          setDialogRowId((current) => (current === row.id ? id : current))
        }
      },
    })
  }

  const handleResumeFile = async (row: ImmersiveVideoAdminRow, file: File) => {
    setPendingFile(file)
    await upload.startUpload(row.id, file, { mode: 'resume' })
  }

  const columns = useMemo(
    () =>
      createImmersiveVideoColumns(
        {
          upload,
          onEdit: (row) => setDialogRowId(row.id),
          // Kind and Video ID are chosen in the dialog's file section.
          onUploadFile: (row) => setDialogRowId(row.id),
          onResumeUpload: (row) => {
            setResumeTargetId(row.id)
            resumeInputRef.current?.click()
          },
          onPublish: (row) => {
            const reason = publishPreconditionLabel(row)
            if (reason) {
              toast.error(reason)
              return
            }
            publish.mutate(
              { id: row.id },
              {
                onError: (error) =>
                  toast.error(getErrorMessage(error, 'Failed to publish')),
              },
            )
          },
        },
        { showProgress },
      ),
    [publish, showProgress, upload],
  )

  const { table, globalFilter, setGlobalFilter, setColumnFilters } =
    useResourceTable({
      tableId: 'immersive-videos',
      data,
      columns,
      enableColumnFilters: true,
      getRowId: (row) => row.id,
    })

  return (
    <div className='p-8'>
      <input
        ref={resumeInputRef}
        type='file'
        accept={immersiveVideoAcceptAll()}
        className='hidden'
        onChange={(event) => {
          const file = event.target.files?.[0]
          const targetId = resumeTargetId
          event.target.value = ''
          if (!file || !targetId) return
          const row = data.find((item) => item.id === targetId)
          if (row) void handleResumeFile(row, file)
        }}
      />
      <DataTableHeader
        table={table}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        filters={
          <div className='flex flex-wrap gap-2'>
            {STATE_FILTERS.map((state) => (
              <FilterBadge
                key={state}
                name={state}
                onClick={() => {
                  setColumnFilters((current) => {
                    const existing = current.find(
                      (filter) => filter.id === 'state',
                    )
                    const selected = new Set(
                      Array.isArray(existing?.value)
                        ? (existing.value as string[])
                        : [],
                    )
                    if (selected.has(state)) selected.delete(state)
                    else selected.add(state)
                    return [
                      ...current.filter((filter) => filter.id !== 'state'),
                      { id: 'state', value: [...selected] },
                    ]
                  })
                }}
              />
            ))}
          </div>
        }
      >
        <Button
          variant='primary'
          className='ml-auto flex items-center'
          onClick={() =>
            createVideo.mutate(undefined, {
              onSuccess: (result) => setDialogRowId(result.id),
              onError: (error) =>
                toast.error(getErrorMessage(error, 'Failed to create video')),
            })
          }
        >
          <PlusSquare />
          Create
        </Button>
      </DataTableHeader>
      <DataTableBody
        table={table}
        columns={columns}
        isLoading={catalog.isPending}
        rowNavigation={(id) => setDialogRowId(id)}
      />
      <DataTableFooter table={table} />
      <ImmersiveVideoDialog
        open={dialogRowId != null}
        row={dialogRow}
        pendingFile={pendingFile}
        upload={upload}
        onFile={(request) => {
          if (dialogRow) void handleFileRequest(dialogRow, request)
        }}
        onOpenChange={(open) => {
          if (open) return
          const id = dialogRowId
          setDialogRowId(null)
          setPendingFile(null)
          if (id) {
            discardIfEmpty.mutate({ id })
          }
        }}
      />
    </div>
  )
}

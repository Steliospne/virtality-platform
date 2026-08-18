'use client'

import { Button } from '@/components/ui/button'
import useMounted from '@/hooks/use-mounted'
import {
  type BucketFolderRow,
  type BucketObjectRow,
  getBucketBreadcrumbs,
} from '@virtality/shared/utils'
import { BucketFolderDeleteDialog } from './bucket-folder-delete-dialog'
import { BucketFolderMoveDialog } from './bucket-folder-move-dialog'
import { BucketFolderRenameDialog } from './bucket-folder-rename-dialog'
import { useBucket } from '@virtality/react-query'
import { Input } from '@virtality/ui/components/input'
import { Spinner } from '@virtality/ui/components/spinner'
import { ChevronRight, Upload } from 'lucide-react'
import { BucketObjectDeleteDialog } from './bucket-object-delete-dialog'
import { BucketObjectDetailsDialog } from './bucket-object-details-dialog'
import { BucketObjectReplaceDialog } from './bucket-object-replace-dialog'
import { BucketObjectMoveDialog } from './bucket-object-move-dialog'
import { BucketObjectRenameDialog } from './bucket-object-rename-dialog'
import { BucketUploadDialog } from './bucket-upload-dialog'
import { BucketBrowserTable } from './bucket-browser-table'
import { useEffect, useMemo, useState } from 'react'

type BucketRowsState = {
  folders: BucketFolderRow[]
  objects: BucketObjectRow[]
  nextContinuationToken: string | null
}

const emptyRows: BucketRowsState = {
  folders: [],
  objects: [],
  nextContinuationToken: null,
}

const BucketBrowser = () => {
  const mounted = useMounted()
  const [prefix, setPrefix] = useState('')
  const [continuationToken, setContinuationToken] = useState<
    string | undefined
  >()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<BucketRowsState>(emptyRows)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [renameObject, setRenameObject] = useState<BucketObjectRow | null>(null)
  const [moveObject, setMoveObject] = useState<BucketObjectRow | null>(null)
  const [replaceObject, setReplaceObject] = useState<BucketObjectRow | null>(
    null,
  )
  const [deleteObject, setDeleteObject] = useState<BucketObjectRow | null>(null)
  const [detailsObject, setDetailsObject] = useState<BucketObjectRow | null>(
    null,
  )
  const [renameFolder, setRenameFolder] = useState<BucketFolderRow | null>(null)
  const [moveFolder, setMoveFolder] = useState<BucketFolderRow | null>(null)
  const [deleteFolder, setDeleteFolder] = useState<BucketFolderRow | null>(null)

  const { data, isLoading, isFetching, error } = useBucket({
    prefix,
    continuationToken,
  })

  useEffect(() => {
    setContinuationToken(undefined)
    setRows(emptyRows)
    setSearch('')
  }, [prefix])

  useEffect(() => {
    if (!data) {
      return
    }

    setRows((current) => {
      if (!continuationToken) {
        return {
          folders: data.folders,
          objects: data.objects,
          nextContinuationToken: data.nextContinuationToken,
        }
      }

      const seenFolderPrefixes = new Set(
        current.folders.map((folder) => folder.prefix),
      )
      const seenObjectKeys = new Set(
        current.objects.map((object) => object.objectKey),
      )

      return {
        folders: [
          ...current.folders,
          ...data.folders.filter(
            (folder) => !seenFolderPrefixes.has(folder.prefix),
          ),
        ],
        objects: [
          ...current.objects,
          ...data.objects.filter(
            (object) => !seenObjectKeys.has(object.objectKey),
          ),
        ],
        nextContinuationToken: data.nextContinuationToken,
      }
    })
  }, [continuationToken, data])

  const breadcrumbs = useMemo(() => getBucketBreadcrumbs(prefix), [prefix])

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return rows.folders
    }

    return rows.folders.filter((folder) =>
      folder.name.toLowerCase().includes(query),
    )
  }, [rows.folders, search])

  const refreshCurrentFolder = () => {
    setContinuationToken(undefined)
    setRows(emptyRows)
  }

  const filteredObjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return rows.objects
    }

    return rows.objects.filter(
      (object) =>
        object.name.toLowerCase().includes(query) ||
        object.objectKey.toLowerCase().includes(query),
    )
  }, [rows.objects, search])

  if (!mounted) {
    return null
  }

  return (
    <div className='flex min-w-0 flex-col gap-4 p-4 sm:p-8'>
      <div className='min-w-0'>
        <h1 className='text-2xl font-semibold'>Bucket manager</h1>
        <p className='text-sm text-zinc-500'>
          Browse CDN-backed bucket objects one folder at a time.
        </p>
      </div>

      <nav
        aria-label='Bucket breadcrumbs'
        className='flex min-w-0 flex-wrap items-center gap-1 text-sm'
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <div
              key={crumb.prefix}
              className='flex max-w-full min-w-0 items-center gap-1'
            >
              {index > 0 && (
                <ChevronRight
                  className='size-4 shrink-0 text-zinc-400'
                  aria-hidden='true'
                />
              )}
              <button
                type='button'
                className={
                  isLast
                    ? 'max-w-full truncate font-medium text-zinc-950 dark:text-zinc-50'
                    : 'max-w-full truncate text-zinc-600 hover:underline dark:text-zinc-300'
                }
                onClick={() => setPrefix(crumb.prefix)}
                disabled={isLast}
                title={crumb.label}
              >
                {crumb.label}
              </button>
            </div>
          )
        })}
      </nav>

      <div className='flex min-w-0 flex-wrap items-center gap-3'>
        <Input
          placeholder='Search in this folder...'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className='w-full max-w-sm min-w-0'
        />
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload />
          Upload
        </Button>
      </div>

      {error ? (
        <p className='text-sm text-red-500'>Failed to load bucket objects.</p>
      ) : null}

      <BucketBrowserTable
        isLoading={isLoading}
        folders={filteredFolders}
        objects={filteredObjects}
        onOpenFolder={setPrefix}
        onRenameFolder={setRenameFolder}
        onMoveFolder={setMoveFolder}
        onDeleteFolder={setDeleteFolder}
        onViewObjectDetails={setDetailsObject}
        onRenameObject={setRenameObject}
        onMoveObject={setMoveObject}
        onReplaceObject={setReplaceObject}
        onDeleteObject={setDeleteObject}
      />

      <BucketUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        currentPrefix={prefix}
      />

      <BucketObjectRenameDialog
        open={renameObject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameObject(null)
          }
        }}
        object={renameObject}
        onRenamed={refreshCurrentFolder}
      />

      <BucketObjectMoveDialog
        open={moveObject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMoveObject(null)
          }
        }}
        object={moveObject}
        onMoved={refreshCurrentFolder}
      />

      <BucketObjectReplaceDialog
        open={replaceObject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReplaceObject(null)
          }
        }}
        object={replaceObject}
        onReplaced={refreshCurrentFolder}
      />

      <BucketObjectDeleteDialog
        open={deleteObject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteObject(null)
          }
        }}
        object={deleteObject}
        onDeleted={refreshCurrentFolder}
      />

      <BucketObjectDetailsDialog
        open={detailsObject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsObject(null)
          }
        }}
        object={detailsObject}
      />

      <BucketFolderRenameDialog
        open={renameFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameFolder(null)
          }
        }}
        folder={renameFolder}
        onRenamed={refreshCurrentFolder}
      />

      <BucketFolderMoveDialog
        open={moveFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMoveFolder(null)
          }
        }}
        folder={moveFolder}
        onMoved={refreshCurrentFolder}
      />

      <BucketFolderDeleteDialog
        open={deleteFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFolder(null)
          }
        }}
        folder={deleteFolder}
        onDeleted={refreshCurrentFolder}
      />

      {rows.nextContinuationToken ? (
        <div>
          <Button
            variant='outline'
            disabled={isFetching}
            onClick={() =>
              setContinuationToken(rows.nextContinuationToken ?? undefined)
            }
          >
            {isFetching ? <Spinner /> : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default BucketBrowser

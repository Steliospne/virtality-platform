'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'
import { useDropdownMenuAction } from '@/hooks/use-dropdown-menu-action'
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
import { format } from 'date-fns'
import {
  ChevronRight,
  Copy,
  Ellipsis,
  FileIcon,
  Folder,
  FolderInput,
  Info,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { BucketObjectDeleteDialog } from './bucket-object-delete-dialog'
import { BucketObjectDetailsDialog } from './bucket-object-details-dialog'
import { BucketObjectReplaceDialog } from './bucket-object-replace-dialog'
import { BucketObjectMoveDialog } from './bucket-object-move-dialog'
import { BucketObjectRenameDialog } from './bucket-object-rename-dialog'
import { BucketUploadDialog } from './bucket-upload-dialog'
import { BucketVideoPreview } from './bucket-video-preview'
import Image from 'next/image'
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

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatLastModified(lastModified: string | null): string {
  if (!lastModified) {
    return '—'
  }

  return format(new Date(lastModified), 'MMM d, yyyy HH:mm')
}

function isImageContentType(contentType: string): boolean {
  return contentType.startsWith('image/')
}

function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith('video/')
}

function ObjectPreview({ object }: { object: BucketObjectRow }) {
  if (isImageContentType(object.contentType)) {
    return (
      <Image
        src={object.cdnUrl}
        alt={object.name}
        width={48}
        height={48}
        className='size-12 rounded-md border border-zinc-600 object-contain'
      />
    )
  }

  if (isVideoContentType(object.contentType)) {
    return <BucketVideoPreview src={object.cdnUrl} label={object.name} />
  }

  return <FileIcon className='size-12 text-zinc-400' aria-hidden='true' />
}

function FolderActions({
  folder,
  onRename,
  onMove,
  onDelete,
}: {
  folder: BucketFolderRow
  onRename: (folder: BucketFolderRow) => void
  onMove: (folder: BucketFolderRow) => void
  onDelete: (folder: BucketFolderRow) => void
}) {
  const { open, setOpen, openDialogAction } = useDropdownMenuAction(folder)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          className='size-8'
          onClick={(event) => event.stopPropagation()}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={openDialogAction(onRename)}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openDialogAction(onMove)}>
          <FolderInput />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={openDialogAction(onDelete)}
          className='text-red-600 focus:text-red-600'
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ObjectActions({
  object,
  onViewDetails,
  onRename,
  onMove,
  onReplace,
  onDelete,
}: {
  object: BucketObjectRow
  onViewDetails: (object: BucketObjectRow) => void
  onRename: (object: BucketObjectRow) => void
  onMove: (object: BucketObjectRow) => void
  onReplace: (object: BucketObjectRow) => void
  onDelete: (object: BucketObjectRow) => void
}) {
  const { open, setOpen, openDialogAction } = useDropdownMenuAction(object)

  const copyCdnUrl = () => {
    void navigator.clipboard.writeText(object.cdnUrl)
  }

  const copyObjectKey = () => {
    void navigator.clipboard.writeText(object.objectKey)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost' className='size-8'>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onSelect={openDialogAction(onViewDetails)}>
          <Info />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copyCdnUrl}>
          <Copy />
          Copy CDN URL
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copyObjectKey}>
          <Copy />
          Copy object key
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openDialogAction(onRename)}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openDialogAction(onMove)}>
          <FolderInput />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openDialogAction(onReplace)}>
          <RefreshCw />
          Replace content
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={openDialogAction(onDelete)}
          className='text-red-600 focus:text-red-600'
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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

      <div className='min-w-0 overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-16'>Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last modified</TableHead>
              <TableHead>Object key</TableHead>
              <TableHead className='w-16 text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
            rows.folders.length === 0 &&
            rows.objects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='py-10 text-center'>
                  <Spinner />
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading &&
            filteredFolders.length === 0 &&
            filteredObjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='py-10 text-center text-zinc-500'
                >
                  No folders or bucket objects in this location.
                </TableCell>
              </TableRow>
            ) : null}

            {filteredFolders.map((folder) => (
              <TableRow
                key={folder.prefix}
                className='cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900'
                onClick={() => setPrefix(folder.prefix)}
              >
                <TableCell>
                  <Folder
                    className='size-8 text-amber-500'
                    aria-hidden='true'
                  />
                </TableCell>
                <TableCell>
                  <div
                    className='max-w-48 truncate font-medium sm:max-w-xs'
                    title={folder.name}
                  >
                    {folder.name}
                  </div>
                </TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  <div
                    className='max-w-48 truncate font-mono text-xs text-zinc-500 sm:max-w-xs'
                    title={folder.prefix}
                  >
                    {folder.prefix}
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <FolderActions
                    folder={folder}
                    onRename={setRenameFolder}
                    onMove={setMoveFolder}
                    onDelete={setDeleteFolder}
                  />
                </TableCell>
              </TableRow>
            ))}

            {filteredObjects.map((object) => (
              <TableRow key={object.objectKey}>
                <TableCell>
                  <ObjectPreview object={object} />
                </TableCell>
                <TableCell>
                  <div
                    className='max-w-48 truncate font-medium sm:max-w-xs'
                    title={object.name}
                  >
                    {object.name}
                  </div>
                </TableCell>
                <TableCell>{object.contentType}</TableCell>
                <TableCell>{formatFileSize(object.size)}</TableCell>
                <TableCell>{formatLastModified(object.lastModified)}</TableCell>
                <TableCell>
                  <div
                    className='max-w-48 truncate font-mono text-xs text-zinc-500 sm:max-w-xs'
                    title={object.objectKey}
                  >
                    {object.objectKey}
                  </div>
                </TableCell>
                <TableCell className='text-right'>
                  <ObjectActions
                    object={object}
                    onViewDetails={setDetailsObject}
                    onRename={setRenameObject}
                    onMove={setMoveObject}
                    onReplace={setReplaceObject}
                    onDelete={setDeleteObject}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

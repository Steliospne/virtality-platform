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
} from '@/components/ui/table'
import useMounted from '@/hooks/use-mounted'
import {
  type BucketFolderRow,
  type BucketObjectRow,
  getBucketBreadcrumbs,
} from '@virtality/shared/utils'
import { useBucket } from '@virtality/react-query'
import { Input } from '@virtality/ui/components/input'
import { Spinner } from '@virtality/ui/components/spinner'
import { format } from 'date-fns'
import {
  ChevronRight,
  Copy,
  Ellipsis,
  FileIcon,
  Film,
  Folder,
  FolderInput,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { BucketObjectDeleteDialog } from './bucket-object-delete-dialog'
import { BucketObjectMoveDialog } from './bucket-object-move-dialog'
import { BucketObjectRenameDialog } from './bucket-object-rename-dialog'
import { BucketUploadDialog } from './bucket-upload-dialog'
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
    return <Film className='size-12 text-zinc-400' aria-hidden='true' />
  }

  return <FileIcon className='size-12 text-zinc-400' aria-hidden='true' />
}

function ObjectActions({
  object,
  onRename,
  onMove,
  onDelete,
}: {
  object: BucketObjectRow
  onRename: (object: BucketObjectRow) => void
  onMove: (object: BucketObjectRow) => void
  onDelete: (object: BucketObjectRow) => void
}) {
  const copyCdnUrl = () => {
    void navigator.clipboard.writeText(object.cdnUrl)
  }

  const copyObjectKey = () => {
    void navigator.clipboard.writeText(object.objectKey)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost' className='size-8'>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={copyCdnUrl}>
          <Copy />
          Copy CDN URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyObjectKey}>
          <Copy />
          Copy object key
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRename(object)}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(object)}>
          <FolderInput />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(object)}
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
  const [continuationToken, setContinuationToken] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<BucketRowsState>(emptyRows)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [renameObject, setRenameObject] = useState<BucketObjectRow | null>(null)
  const [moveObject, setMoveObject] = useState<BucketObjectRow | null>(null)
  const [deleteObject, setDeleteObject] = useState<BucketObjectRow | null>(null)

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
    <div className='flex flex-col gap-4 p-8'>
      <div>
        <h1 className='text-2xl font-semibold'>Bucket manager</h1>
        <p className='text-sm text-zinc-500'>
          Browse CDN-backed bucket objects one folder at a time.
        </p>
      </div>

      <nav
        aria-label='Bucket breadcrumbs'
        className='flex flex-wrap items-center gap-1 text-sm'
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <div key={crumb.prefix} className='flex items-center gap-1'>
              {index > 0 && (
                <ChevronRight className='size-4 text-zinc-400' aria-hidden='true' />
              )}
              <button
                type='button'
                className={
                  isLast
                    ? 'font-medium text-zinc-950 dark:text-zinc-50'
                    : 'text-zinc-600 hover:underline dark:text-zinc-300'
                }
                onClick={() => setPrefix(crumb.prefix)}
                disabled={isLast}
              >
                {crumb.label}
              </button>
            </div>
          )
        })}
      </nav>

      <div className='flex flex-wrap items-center gap-3'>
        <Input
          placeholder='Search in this folder...'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className='max-w-sm'
        />
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Upload />
          Upload
        </Button>
      </div>

      {error ? (
        <p className='text-sm text-red-500'>Failed to load bucket objects.</p>
      ) : null}

      <div className='rounded-md border'>
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
            {isLoading && rows.folders.length === 0 && rows.objects.length === 0 ? (
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
                <TableCell colSpan={7} className='py-10 text-center text-zinc-500'>
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
                  <Folder className='size-8 text-amber-500' aria-hidden='true' />
                </TableCell>
                <TableCell className='font-medium'>{folder.name}</TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell className='font-mono text-xs text-zinc-500'>
                  {folder.prefix}
                </TableCell>
                <TableCell />
              </TableRow>
            ))}

            {filteredObjects.map((object) => (
              <TableRow key={object.objectKey}>
                <TableCell>
                  <ObjectPreview object={object} />
                </TableCell>
                <TableCell className='font-medium'>{object.name}</TableCell>
                <TableCell>{object.contentType}</TableCell>
                <TableCell>{formatFileSize(object.size)}</TableCell>
                <TableCell>{formatLastModified(object.lastModified)}</TableCell>
                <TableCell className='max-w-xs truncate font-mono text-xs text-zinc-500'>
                  {object.objectKey}
                </TableCell>
                <TableCell className='text-right'>
                  <ObjectActions
                    object={object}
                    onRename={setRenameObject}
                    onMove={setMoveObject}
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

      {rows.nextContinuationToken ? (
        <div>
          <Button
            variant='outline'
            disabled={isFetching}
            onClick={() => setContinuationToken(rows.nextContinuationToken ?? undefined)}
          >
            {isFetching ? <Spinner /> : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default BucketBrowser

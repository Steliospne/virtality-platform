'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'
import type { BucketFolderRow, BucketObjectRow } from '@virtality/shared/utils'
import { Spinner } from '@virtality/ui/components/spinner'
import { Folder } from 'lucide-react'
import { format } from 'date-fns'
import { FolderActions } from './bucket-folder-actions'
import { ObjectActions } from './bucket-object-actions'
import { ObjectPreview } from './bucket-object-preview'

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

type BucketBrowserTableProps = {
  isLoading: boolean
  folders: BucketFolderRow[]
  objects: BucketObjectRow[]
  onOpenFolder: (prefix: string) => void
  onRenameFolder: (folder: BucketFolderRow) => void
  onMoveFolder: (folder: BucketFolderRow) => void
  onDeleteFolder: (folder: BucketFolderRow) => void
  onViewObjectDetails: (object: BucketObjectRow) => void
  onRenameObject: (object: BucketObjectRow) => void
  onMoveObject: (object: BucketObjectRow) => void
  onReplaceObject: (object: BucketObjectRow) => void
  onDeleteObject: (object: BucketObjectRow) => void
}

export function BucketBrowserTable({
  isLoading,
  folders,
  objects,
  onOpenFolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onViewObjectDetails,
  onRenameObject,
  onMoveObject,
  onReplaceObject,
  onDeleteObject,
}: BucketBrowserTableProps) {
  return (
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
          {isLoading && folders.length === 0 && objects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className='py-10 text-center'>
                <Spinner />
              </TableCell>
            </TableRow>
          ) : null}

          {!isLoading && folders.length === 0 && objects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className='py-10 text-center text-zinc-500'
              >
                No folders or bucket objects in this location.
              </TableCell>
            </TableRow>
          ) : null}

          {folders.map((folder) => (
            <TableRow
              key={folder.prefix}
              className='cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900'
              onClick={() => onOpenFolder(folder.prefix)}
            >
              <TableCell>
                <Folder className='size-8 text-amber-500' aria-hidden='true' />
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
                  onRename={onRenameFolder}
                  onMove={onMoveFolder}
                  onDelete={onDeleteFolder}
                />
              </TableCell>
            </TableRow>
          ))}

          {objects.map((object) => (
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
                  onViewDetails={onViewObjectDetails}
                  onRename={onRenameObject}
                  onMove={onMoveObject}
                  onReplace={onReplaceObject}
                  onDelete={onDeleteObject}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenuAction } from '@/hooks/use-dropdown-menu-action'
import { type BucketObjectRow } from '@virtality/shared/utils'
import {
  Copy,
  Ellipsis,
  FolderInput,
  Info,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'

export function ObjectActions({
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

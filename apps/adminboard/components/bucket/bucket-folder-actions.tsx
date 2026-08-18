'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenuAction } from '@/hooks/use-dropdown-menu-action'
import { type BucketFolderRow } from '@virtality/shared/utils'
import { Ellipsis, FolderInput, Pencil, Trash2 } from 'lucide-react'

export function FolderActions({
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

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAdminEmailDraftHeaderMenuItems } from '@/lib/admin-email-draft-actions'
import { Archive, Copy, Eye, MoreHorizontal, RotateCcw } from 'lucide-react'

type AdminEmailDraftHeaderMenuProps = {
  isFinalSent: boolean
  isArchived?: boolean
  onPreview: () => void
  onClone: () => void
  onArchive: () => void
  onRestore?: () => void
  isClonePending?: boolean
  isRestorePending?: boolean
}

export const AdminEmailDraftHeaderMenu = ({
  isFinalSent,
  isArchived = false,
  onPreview,
  onClone,
  onArchive,
  onRestore,
  isClonePending = false,
  isRestorePending = false,
}: AdminEmailDraftHeaderMenuProps) => {
  const menuItems = getAdminEmailDraftHeaderMenuItems(isFinalSent, isArchived)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='outline' size='icon' aria-label='Draft actions'>
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={
              (item.id === 'clone' && isClonePending) ||
              (item.id === 'restore' && isRestorePending)
            }
            onSelect={() => {
              if (item.id === 'preview') {
                onPreview()
                return
              }

              if (item.id === 'archive') {
                onArchive()
                return
              }

              if (item.id === 'restore') {
                onRestore?.()
                return
              }

              onClone()
            }}
          >
            {item.id === 'preview' ? (
              <Eye className='mr-2 size-4' />
            ) : item.id === 'archive' ? (
              <Archive className='mr-2 size-4' />
            ) : item.id === 'restore' ? (
              <RotateCcw className='mr-2 size-4' />
            ) : (
              <Copy className='mr-2 size-4' />
            )}
            {item.id === 'clone' && isClonePending
              ? 'Cloning...'
              : item.id === 'restore' && isRestorePending
                ? 'Restoring...'
                : item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDropdownMenu } from '@/hooks/use-dropdown-menu-action'
import {
  type AdminEmailDraftHeaderMenuItem,
  type AdminEmailDraftHeaderMenuItemId,
  getAdminEmailDraftHeaderMenuItems,
} from '@/lib/admin-email-draft-actions'
import { Archive, Copy, Eye, MoreHorizontal, RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MENU_ITEM_ICONS: Record<AdminEmailDraftHeaderMenuItemId, LucideIcon> = {
  preview: Eye,
  clone: Copy,
  archive: Archive,
  restore: RotateCcw,
}

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

const getMenuItemLabel = (
  item: AdminEmailDraftHeaderMenuItem,
  isClonePending: boolean,
  isRestorePending: boolean,
): string => {
  if (item.id === 'clone' && isClonePending) {
    return 'Cloning...'
  }

  if (item.id === 'restore' && isRestorePending) {
    return 'Restoring...'
  }

  return item.label
}

const handleMenuItemSelect = (
  itemId: AdminEmailDraftHeaderMenuItemId,
  handlers: Pick<
    AdminEmailDraftHeaderMenuProps,
    'onPreview' | 'onClone' | 'onArchive' | 'onRestore'
  >,
) => {
  switch (itemId) {
    case 'preview':
      handlers.onPreview()
      break
    case 'archive':
      handlers.onArchive()
      break
    case 'restore':
      handlers.onRestore?.()
      break
    case 'clone':
      handlers.onClone()
      break
  }
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
  const { open, setOpen, runAfterClose } = useDropdownMenu()
  const menuItems = getAdminEmailDraftHeaderMenuItems(isFinalSent, isArchived)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='outline' size='icon' aria-label='Draft actions'>
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {menuItems.map((item) => {
          const Icon = MENU_ITEM_ICONS[item.id]

          return (
            <DropdownMenuItem
              key={item.id}
              disabled={
                (item.id === 'clone' && isClonePending) ||
                (item.id === 'restore' && isRestorePending)
              }
              onSelect={() =>
                runAfterClose(() =>
                  handleMenuItemSelect(item.id, {
                    onPreview,
                    onClone,
                    onArchive,
                    onRestore,
                  }),
                )
              }
            >
              <Icon className='mr-2 size-4' />
              {getMenuItemLabel(item, isClonePending, isRestorePending)}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RemoveRenewTriggerDialog } from '@/components/renew-triggers/remove-renew-trigger-dialog'
import { getErrorMessage } from '@/lib/get-error-message'
import { formatRenewTriggerOffsetLabel } from '@/lib/renew-triggers'
import type {
  RenewTriggerChannel,
  RenewTriggerListItem,
} from '@virtality/shared/types'
import { useUpdateRenewTrigger } from '@virtality/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type RenewTriggerListProps = {
  channel: RenewTriggerChannel
  triggers: RenewTriggerListItem[]
  onEdit: (trigger: RenewTriggerListItem) => void
}

export function RenewTriggerList({
  channel,
  triggers,
  onEdit,
}: RenewTriggerListProps) {
  const { mutate: updateRenewTrigger, isPending: isUpdating } =
    useUpdateRenewTrigger()
  const [triggerToRemove, setTriggerToRemove] =
    useState<RenewTriggerListItem | null>(null)

  const handleToggleActive = (trigger: RenewTriggerListItem) => {
    updateRenewTrigger(
      { id: trigger.id, active: !trigger.active },
      {
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to update renew trigger.'))
        },
      },
    )
  }

  return (
    <>
      <ul className='space-y-3'>
        {triggers.map((trigger) => (
          <li
            key={trigger.id}
            className='flex items-center gap-4 rounded-lg border p-3'
          >
            <div className='min-w-0 flex-1'>
              <p className='font-medium'>
                {formatRenewTriggerOffsetLabel(trigger.daysBefore)}
              </p>
              <label className='text-muted-foreground mt-1 flex items-center gap-2 text-sm'>
                <Checkbox
                  checked={trigger.active}
                  disabled={isUpdating}
                  onCheckedChange={() => handleToggleActive(trigger)}
                />
                {trigger.active ? 'Active' : 'Inactive'}
              </label>
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                aria-label={`Edit ${trigger.daysBefore}-day trigger`}
                onClick={() => onEdit(trigger)}
              >
                <Pencil className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                aria-label={`Remove ${trigger.daysBefore}-day trigger`}
                onClick={() => setTriggerToRemove(trigger)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <RemoveRenewTriggerDialog
        channel={channel}
        open={triggerToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setTriggerToRemove(null)
          }
        }}
        trigger={triggerToRemove}
      />
    </>
  )
}

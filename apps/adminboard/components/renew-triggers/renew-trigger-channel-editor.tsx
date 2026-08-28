'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  RenewTriggerFormDialog,
  type RenewTriggerDialogMode,
} from '@/components/renew-triggers/renew-trigger-form-dialog'
import { RenewTriggerList } from '@/components/renew-triggers/renew-trigger-list'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  RENEW_TRIGGER_CHANNEL_DESCRIPTIONS,
  RENEW_TRIGGER_CHANNEL_LABELS,
} from '@/lib/renew-triggers'
import type {
  RenewTriggerChannel,
  RenewTriggerListItem,
} from '@virtality/shared/types'
import { isRenewChannelSilenced } from '@virtality/shared/utils'
import { useRenewTriggers, useUpdateRenewTrigger } from '@virtality/react-query'
import { Label } from '@virtality/ui/components/label'
import { PlusSquare } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

type RenewTriggerChannelEditorProps = {
  channel: RenewTriggerChannel
}

export function RenewTriggerChannelEditor({
  channel,
}: RenewTriggerChannelEditorProps) {
  const [dialogMode, setDialogMode] = useState<RenewTriggerDialogMode>(null)
  const [editingTrigger, setEditingTrigger] =
    useState<RenewTriggerListItem | null>(null)
  const { data: triggers = [], isPending } = useRenewTriggers(channel)
  const { mutateAsync: updateRenewTrigger, isPending: isUpdatingChannel } =
    useUpdateRenewTrigger()
  const silenced = isRenewChannelSilenced(triggers)
  const channelActive = triggers.some((trigger) => trigger.active)
  const channelToggleId = `renew-trigger-channel-${channel}`

  const handleChannelToggle = async (active: boolean) => {
    const triggersToUpdate = triggers.filter(
      (trigger) => trigger.active !== active,
    )
    if (triggersToUpdate.length === 0) {
      return
    }

    try {
      await Promise.all(
        triggersToUpdate.map((trigger) =>
          updateRenewTrigger({ id: trigger.id, active }),
        ),
      )
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, 'Failed to update renew trigger channel.'),
      )
    }
  }

  const handleEdit = (trigger: RenewTriggerListItem) => {
    setEditingTrigger(trigger)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setEditingTrigger(null)
  }

  const handleOpenCreate = () => {
    setEditingTrigger(null)
    setDialogMode('create')
  }

  let listContent: ReactNode
  if (isPending) {
    listContent = (
      <p className='text-muted-foreground text-sm'>Loading renew triggers...</p>
    )
  } else if (triggers.length === 0) {
    listContent = (
      <p className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
        No rows. This channel is silenced until you add an active offset.
      </p>
    )
  } else {
    listContent = (
      <RenewTriggerList
        channel={channel}
        triggers={triggers}
        onEdit={handleEdit}
      />
    )
  }

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-xl space-y-1'>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='text-xl font-semibold tracking-tight'>
              {RENEW_TRIGGER_CHANNEL_LABELS[channel]}
            </h2>
            {triggers.length > 0 ? (
              <div className='flex items-center gap-2'>
                <Switch
                  id={channelToggleId}
                  checked={channelActive}
                  disabled={isPending || isUpdatingChannel}
                  onCheckedChange={handleChannelToggle}
                  aria-label={`${channelActive ? 'Deactivate' : 'Activate'} ${RENEW_TRIGGER_CHANNEL_LABELS[channel]}`}
                />
                <Label
                  htmlFor={channelToggleId}
                  className='text-muted-foreground text-sm font-normal'
                >
                  {channelActive ? 'Channel active' : 'Channel inactive'}
                </Label>
              </div>
            ) : null}
          </div>
          <p className='text-muted-foreground text-sm'>
            {RENEW_TRIGGER_CHANNEL_DESCRIPTIONS[channel]}
          </p>
          {silenced ? (
            <p className='text-sm text-amber-700 dark:text-amber-400'>
              Channel silenced: empty list or all rows inactive.
            </p>
          ) : null}
        </div>
        <Button
          variant='primary'
          className='ml-auto flex items-center'
          onClick={handleOpenCreate}
        >
          <PlusSquare />
          Add offset
        </Button>
      </div>

      {listContent}

      <RenewTriggerFormDialog
        channel={channel}
        trigger={editingTrigger}
        mode={dialogMode}
        onClose={handleCloseDialog}
      />
    </section>
  )
}

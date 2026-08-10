'use client'

import { Button } from '@/components/ui/button'
import {
  RenewTriggerFormDialog,
  type RenewTriggerDialogMode,
} from '@/components/renew-triggers/renew-trigger-form-dialog'
import { RenewTriggerList } from '@/components/renew-triggers/renew-trigger-list'
import {
  RENEW_TRIGGER_CHANNEL_DESCRIPTIONS,
  RENEW_TRIGGER_CHANNEL_LABELS,
} from '@/lib/renew-triggers'
import type {
  RenewTriggerChannel,
  RenewTriggerListItem,
} from '@virtality/shared/types'
import { isRenewChannelSilenced } from '@virtality/shared/utils'
import { useRenewTriggers } from '@virtality/react-query'
import { PlusSquare } from 'lucide-react'
import { useState, type ReactNode } from 'react'

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
  const silenced = isRenewChannelSilenced(triggers)

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
          <h2 className='text-xl font-semibold tracking-tight'>
            {RENEW_TRIGGER_CHANNEL_LABELS[channel]}
          </h2>
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

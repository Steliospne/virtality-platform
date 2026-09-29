'use client'

import Link from 'next/link'
import { RectangleGoggles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isHeadsetSelectable } from '@/lib/home-session-picker'
import type { DeviceVrPresenceStatus } from '@/lib/vr-presence-status'
import type { HomeDashboardData } from './use-home-dashboard-data'
import StartSessionStep from './start-session-step'
import StartSessionOption from './start-session-option'
import type { StartSessionPicker } from './use-start-session-picker'

const presenceLabel: Record<DeviceVrPresenceStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  loading: 'Checking…',
  unpaired: 'Not paired',
}

const StartSessionHeadsetStep = ({
  devices,
  presenceById,
  picker,
}: {
  devices: HomeDashboardData['devices']
  presenceById: HomeDashboardData['presenceById']
  picker: StartSessionPicker
}) => {
  const { selection, selectDevice } = picker

  return (
    <StartSessionStep
      number={3}
      label='Headset'
      done={Boolean(selection.deviceId)}
      footer={
        <Link
          href='/devices'
          className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-[13px]'
        >
          <RectangleGoggles className='size-4' /> Pair a headset
        </Link>
      }
    >
      {devices.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>
          No headsets yet. Add one and pair it to launch a session.
        </p>
      ) : null}
      {devices.map(({ data }) => {
        const status = presenceById[data.id] ?? 'unpaired'
        const selectable = isHeadsetSelectable(status)
        return (
          <StartSessionOption
            key={data.id}
            selected={selection.deviceId === data.id}
            disabled={!selectable}
            onSelect={() => selectDevice(data.id)}
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                status === 'online' && 'bg-green-600 dark:bg-green-400',
                status === 'loading' && 'bg-muted-foreground animate-pulse',
                (status === 'offline' || status === 'unpaired') &&
                  'bg-muted-foreground',
              )}
              aria-hidden
            />
            <div className='min-w-0 flex-1'>
              <div className='truncate'>
                {data.model ? `${data.model} · ` : ''}
                {data.name}
              </div>
              <small className='text-muted-foreground block text-xs'>
                {presenceLabel[status]}
              </small>
            </div>
          </StartSessionOption>
        )
      })}
    </StartSessionStep>
  )
}

export default StartSessionHeadsetStep

'use client'

import { Loader2 } from 'lucide-react'
import { Item } from '@/components/ui/item'

/** Shown while a launch handed over from the home dashboard is still armed. */
const AutoLaunchStatus = ({ connected }: { connected: boolean }) => (
  <Item
    variant='outline'
    size='sm'
    className='border-vital-blue-700/40 text-vital-blue-800 dark:text-vital-blue-300 max-h-9 gap-2 p-1 px-2 text-xs'
    aria-live='polite'
  >
    <Loader2 className='size-3.5 animate-spin' />
    {connected
      ? 'Waiting for the headset, then launching…'
      : 'Connecting to the headset…'}
  </Item>
)

export default AutoLaunchStatus

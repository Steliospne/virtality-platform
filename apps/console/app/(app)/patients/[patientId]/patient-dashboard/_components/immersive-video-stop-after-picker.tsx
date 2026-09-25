'use client'

import { useState } from 'react'
import { Timer } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Separator } from '@virtality/ui/components/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { formatStopAfterLabel } from '@/lib/immersive-video-auto-stop'
import { cn } from '@/lib/utils'
import { ImmersiveVideoStopAfterPresets } from './immersive-video-stop-after-presets'
import { ImmersiveVideoStopAfterCustomForm } from './immersive-video-stop-after-custom-form'

/** Picks the **Session Time Limit**; changeable mid-session to extend or shorten it. */
export function ImmersiveVideoStopAfterPicker({
  className,
}: {
  className?: string
}) {
  const { stopAfterMin, setStopAfterMin, sessionElapsedSec, frozen } =
    useImmersiveVideoSession()
  const [open, setOpen] = useState(false)

  const choose = (minutes: number | null) => {
    setStopAfterMin(minutes)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          aria-label='Stop the video after'
          disabled={frozen}
          className={cn('hover:bg-card dark:border-zinc-600', className)}
        >
          <Timer />
          {formatStopAfterLabel(stopAfterMin)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='flex w-56 flex-col gap-1 p-1'>
        <ImmersiveVideoStopAfterPresets
          stopAfterMin={stopAfterMin}
          elapsedSec={sessionElapsedSec}
          onChoose={choose}
        />
        <Separator />
        <ImmersiveVideoStopAfterCustomForm
          stopAfterMin={stopAfterMin}
          elapsedSec={sessionElapsedSec}
          onApply={choose}
        />
      </PopoverContent>
    </Popover>
  )
}
